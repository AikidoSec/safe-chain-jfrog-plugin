import { PlatformContext } from 'jfrog-workers';
import {
  BeforeDownloadRequest,
  BeforeDownloadResponse,
  DownloadStatus,
  RepoType,
} from './types';

// define consts for both npm and pip
export const ECOSYSTEM_JS = 'js';
export const ECOSYSTEM_PY = 'py';

export default async (
  context: PlatformContext,
  data: BeforeDownloadRequest
): Promise<BeforeDownloadResponse> => {
  console.log(JSON.stringify(data));
  try {
    if (!isRemoteRepo(data)) {
      // We only want to run safe-chain checks on remote npm repos
      return {
        status: DownloadStatus.DOWNLOAD_PROCEED,
        message: 'Safe-Chain allowing download, repo type is not remote.',
      };
    }

    const ecosystem = getEcosystem(data);
    if (!ecosystem) {
      return {
        status: DownloadStatus.DOWNLOAD_PROCEED,
        message: 'Safe-Chain allowing download, no supported ecosystem found',
      };
    }

    // extract package name & version from metadata
    const packageDetails = getPkgNameAndVersion(data);
    if (!packageDetails) {
      return {
        status: DownloadStatus.DOWNLOAD_WARN,
        message:
          "Safe-Chain wasn't able to extract package name and/or version.",
      };
    }
    console.log(
      `safe-chain scanning package ${packageDetails.name} and version ${packageDetails.version}`
    );

    // Fetch json database from aikido (around 8MB, size constraints met)
    const malwareDatabase = await openMalwareDatabase(ecosystem);
    console.log(
      `safe-chain got database version ${malwareDatabase.version} for ecosystem ${ecosystem}`
    );

    // Check if match in malware database
    if (
      malwareDatabase.isMalware(packageDetails.name, packageDetails.version)
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
const getEcosystem = (data: BeforeDownloadRequest) => {
  if (data.repoPath.path.startsWith('npm')) {
    return ECOSYSTEM_JS;
  }
  return undefined;
};

const getPkgNameAndVersion = (
  data: BeforeDownloadRequest
): { name: string; version: string } | undefined => {
  const name: string | undefined = undefined;
  const version: string | undefined = undefined;

  // [extraction code to do]

  if (!name || !version) {
    return undefined;
  }

  return { name, version };
};

// MALWARE CODE
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
  ecosystem: string
): Promise<MalwareDatabase> {
  const { malwareDatabase, version } = await fetchMalwareDatabase(ecosystem);

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

// fetch malware database
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
  ecosystem: string
): Promise<MalwareDatabaseResponse> {
  const malwareDatabaseUrl =
    malwareDatabaseUrls[ecosystem as keyof typeof malwareDatabaseUrls];
  const response = await fetch(malwareDatabaseUrl);

  if (!response.ok) {
    throw new Error(
      `Error fetching ${ecosystem} malware database: ${response.statusText}`
    );
  }

  try {
    const malwareDatabase = await response.json();
    return {
      malwareDatabase: malwareDatabase as MalwarePackage[],
      version: response.headers.get('etag') ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing malware database: ${error.message}`);
    }
    throw new Error('Error parsing malware database: Unknown error');
  }
}
