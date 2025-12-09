import {PlatformContext} from 'jfrog-workers';
import {BeforeDownloadRequest, BeforeDownloadResponse, DownloadStatus, RepoType} from './types';
import {fetchMalwareDatabase} from "./aikido-malware";

export default async (context: PlatformContext, data: BeforeDownloadRequest): Promise<BeforeDownloadResponse> => {
    let status: DownloadStatus = DownloadStatus.DOWNLOAD_STOP;
    let message = 'Safe-Chain could not verify safety, stopping download.';

    try {
        if (data.metadata.repoType != RepoType.REPO_TYPE_REMOTE) {
            // We only want to run safe-chain checks on remote npm repos
            return {
                status: DownloadStatus.DOWNLOAD_PROCEED,
                message: "Safe-Chain allowing download, repo type is not remote."
            };
        }

        // Check if it's npm or pypi
        const ecosystem: string | undefined = undefined;

        if (!ecosystem) {
            return {
                status: DownloadStatus.DOWNLOAD_PROCEED,
                message: "Safe-Chain allowing download, no supported ecosystem found"
            }
        }

        // Fetch json database from aikido (around 8MB, size constraints met)
        const malwareDatabase = await fetchMalwareDatabase(ecosystem);

    } catch (error) {
        console.log(`Got error: ${JSON.stringify(error)}`);
        message += `\nError: ${JSON.stringify(error)}`;
    }

    return {
        status, message
    }
}