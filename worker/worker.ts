import { PlatformContext } from 'jfrog-workers';
import { BeforeDownloadRequest, BeforeDownloadResponse, DownloadStatus } from './types';
import {fetchMalwareDatabase} from "./aikido-malware";

export default async (context: PlatformContext, data: BeforeDownloadRequest): Promise<BeforeDownloadResponse> => {
    let status: DownloadStatus = DownloadStatus.DOWNLOAD_PROCEED;
    let message = 'Allowing Download';

    try {
        // Fetch ~8MB json database from aikido
        const malwareDatabase = await fetchMalwareDatabase("js");
    } catch (error) {
        console.log(`Got error: ${JSON.stringify(error)}`);
        message = `Safe-Chain could not check safety.`;
        status = DownloadStatus.DOWNLOAD_STOP;
    }

    return {
        status, message,
    }
}