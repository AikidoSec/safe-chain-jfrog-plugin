import { PlatformContext } from 'jfrog-workers';
import {
  BeforeDownloadRequest,
  BeforeDownloadResponse,
  RepoType,
} from './types';
import * as consts from './consts';
import { getPkgNameAndVersion } from './getPkgNameAndVersion';
import { openMalwareDatabase } from './aikido/openMalwareDatabase';

export default async (
  context: PlatformContext,
  data: BeforeDownloadRequest
): Promise<BeforeDownloadResponse> => {
  console.log(JSON.stringify(data));
  try {
    if (!isRemoteRepo(data)) {
      // We only want to run safe-chain checks on remote npm repos
      return consts.DOWNLOAD_OK_NOT_REMOTE;
    }

    const ecosystem = getEcosystem(data);
    if (!ecosystem) {
      return consts.DOWNLOAD_OK_ECOSYSTEM;
    }

    // extract package name & version from metadata
    const packageDetails = getPkgNameAndVersion(data);
    if (!packageDetails) {
      return consts.DOWNLOAD_WARN_NO_PACKAGE_NAME_OR_VERSION;
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
      return consts.DOWNLOAD_STOP_MALWARE;
    }

    return consts.DOWNLOAD_OK_SAFE;
  } catch (error) {
    console.log(`Got error: ${JSON.stringify(error)}`);
  }
  return consts.DOWNLOAD_STOP_ERROR;
};
const isRemoteRepo = (data: BeforeDownloadRequest) => {
  return data.metadata.repoType == RepoType.REPO_TYPE_REMOTE;
};
const getEcosystem = (data: BeforeDownloadRequest) => {
  if (data.repoPath.path.startsWith('npm')) {
    return consts.ECOSYSTEM_JS;
  }
  return undefined;
};
