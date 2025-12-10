// define types
interface BeforeDownloadRequest {
  metadata: DownloadMetadata | undefined;
  repoPath: RepoPath | undefined;
}

interface DownloadMetadata {
  repoPath: RepoPath | undefined;
  originalRepoPath: RepoPath | undefined;
  name: string;
  repoType: RepoType;
}

interface RepoPath {
  key: string;
  path: string;
  id: string;
  isRoot: boolean;
  isFolder: boolean;
}

enum RepoType {
  REPO_TYPE_UNSPECIFIED = 0,
  REPO_TYPE_LOCAL = 1,
  REPO_TYPE_REMOTE = 2,
  REPO_TYPE_FEDERATED = 3,
  UNRECOGNIZED = -1,
}

interface BeforeDownloadResponse {
  status: DownloadStatus;
  message: string;
}

enum DownloadStatus {
  DOWNLOAD_UNSPECIFIED = 0,
  DOWNLOAD_PROCEED = 1,
  DOWNLOAD_STOP = 2,
  DOWNLOAD_WARN = 3,
  UNRECOGNIZED = -1,
}

const ECOSYSTEM_JS = 'js';
const ECOSYSTEM_PY = 'py';

export default async (
  context: any,
  data: BeforeDownloadRequest
): Promise<BeforeDownloadResponse> => {
  try {
    if (!isRemoteRepo(data)) {
      // We only want to run safe-chain checks on remote npm repos
      return {
        status: DownloadStatus.DOWNLOAD_PROCEED,
        message: 'Safe-Chain allowing download, repo type is not remote.',
      };
    }

    // extract package name & version from metadata
    const npmPackage = parseNpmPackageUrl(data.repoPath.path);
    if (!npmPackage) {
      return {
        status: DownloadStatus.DOWNLOAD_WARN,
        message:
          "Safe-Chain wasn't able to extract package name and/or version.",
      };
    }
    console.log(
      `safe-chain scanning package ${npmPackage.packageName} and version ${npmPackage.version}`
    );

    // Fetch json database from aikido (around 8MB, size constraints met)
    const ecosystem = ECOSYSTEM_JS;
    const malwareDatabase = await openMalwareDatabase(ecosystem, context.clients.axios);
    console.log(
      `safe-chain got database version ${malwareDatabase.version} for ecosystem ${ecosystem}`
    );

    // Check if match in malware database
    if (
      malwareDatabase.isMalware(npmPackage.packageName, npmPackage.version)
    ) {
      console.log(`safe-chain detected malware.`);
      return {
        status: DownloadStatus.DOWNLOAD_STOP,
        message: 'Safe-Chain detected malware, stopping download.',
      };
    }

    return {
      status: DownloadStatus.DOWNLOAD_PROCEED,
      message: 'Safe-Chain allowing download, is safe.',
    };
  } catch (error) {
    console.log(`Got error: ${JSON.stringify(error)}`);
  }
  return {
    status: DownloadStatus.DOWNLOAD_STOP,
    message: 'Safe-Chain could not verify safety, stopping download.',
  };
};
const isRemoteRepo = (data: BeforeDownloadRequest) => {
  return data.metadata.repoType == RepoType.REPO_TYPE_REMOTE;
};

type MalwareDatabase = {
  version: string;
  isMalware: (name: string, version: string) => boolean;
};

const MALWARE_STATUS_OK = 'OK';

function normalizePackageName(name: string, ecosystem: string): string {
  if (ecosystem === ECOSYSTEM_PY) {
    return name.toLowerCase().replace(/[-_.]+/g, '-');
  }
  return name;
}

function isMalwareStatus(status: string): boolean {
  return status !== MALWARE_STATUS_OK;
}

export async function openMalwareDatabase(
  ecosystem: string,
  axios: any,
): Promise<MalwareDatabase> {
  const { malwareDatabase, version } = await fetchMalwareDatabase(ecosystem, axios);

  function getPackageStatus(name: string, version: string): string {
    const normalizedName = normalizePackageName(name, ecosystem);
    const packageData = malwareDatabase.find((pkg) => {
      const normalizedPkgName = normalizePackageName(
        pkg.package_name,
        ecosystem
      );
      const isNameMatch = normalizedPkgName === normalizedName;
      const isVersionMatch = pkg.version === version || pkg.version === '*';
      return isNameMatch && isVersionMatch;
    });
    if (!packageData) {
      return MALWARE_STATUS_OK;
    }
    return packageData.reason;
  }

  return {
    version,
    isMalware: (name: string, version: string) => {
      const status = getPackageStatus(name, version);
      return isMalwareStatus(status);
    },
  };
}

const malwareDatabaseUrls = {
  [ECOSYSTEM_JS]: 'https://malware-list.aikido.dev/malware_predictions.json',
  [ECOSYSTEM_PY]: 'https://malware-list.aikido.dev/malware_pypi.json',
} as const;

interface MalwarePackage {
  package_name: string;
  version: string;
  reason: string;
}

interface MalwareDatabaseResponse {
  malwareDatabase: MalwarePackage[];
  version: string | undefined;
}

/**
 * Fetches the malware database for the current ecosystem.
 * @returns {Promise<MalwareDatabaseResponse>}
 */
export async function fetchMalwareDatabase(
  ecosystem: string,
  axios: any,
): Promise<MalwareDatabaseResponse> {
  const malwareDatabaseUrl =
    malwareDatabaseUrls[ecosystem as keyof typeof malwareDatabaseUrls];
  const response = await axios.get(malwareDatabaseUrl);

  if (!response.ok) {
    throw new Error(
      `Error fetching ${ecosystem} malware database: ${response.statusText}`
    );
  }

  try {
    const malwareDatabase = response.data;
    return {
      malwareDatabase: malwareDatabase as MalwarePackage[],
      version: response.headers['etag'] ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing malware database: ${error.message}`);
    }
    throw new Error('Error parsing malware database: Unknown error');
  }
}


/**
 * Copied from packages/safe-chain/src/registryProxy/interceptors/npm/parseNpmPackageUrl.js
 * @param {string} urlPath
 * @returns {{packageName: string | undefined, version: string | undefined}}
 */
export function parseNpmPackageUrl(urlPath: string) {
  let packageName, version;

  const separatorIndex = urlPath.indexOf("/-/");
  if (separatorIndex === -1) {
    return { packageName, version };
  }

  packageName = urlPath.substring(0, separatorIndex);
  const filename = urlPath.substring(
    separatorIndex + 3,
    urlPath.length - 4
  ); // Remove /-/ and .tgz

  // Extract version from filename
  // For scoped packages like @babel/core, the filename is core-7.21.4.tgz
  // For regular packages like lodash, the filename is lodash-4.17.21.tgz
  if (packageName.startsWith("@")) {
    const scopedPackageName = packageName.substring(
      packageName.lastIndexOf("/") + 1
    );
    if (filename.startsWith(scopedPackageName + "-")) {
      version = filename.substring(scopedPackageName.length + 1);
    }
  } else {
    if (filename.startsWith(packageName + "-")) {
      version = filename.substring(packageName.length + 1);
    }
  }

  return { packageName, version };
}
