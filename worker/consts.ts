import {DownloadStatus} from "./types";

export const ECOSYSTEM_JS = "js";
export const ECOSYSTEM_PY = "py";

export const DOWNLOAD_OK_NOT_REMOTE = {
    status: DownloadStatus.DOWNLOAD_PROCEED,
    message: "Safe-Chain allowing download, repo type is not remote."
}
export const DOWNLOAD_OK_ECOSYSTEM = {
    status: DownloadStatus.DOWNLOAD_PROCEED,
    message: "Safe-Chain allowing download, no supported ecosystem found"
}
export const DOWNLOAD_STOP_ERROR = {
    status: DownloadStatus.DOWNLOAD_STOP,
    message: 'Safe-Chain could not verify safety, stopping download.'
};
export const DOWNLOAD_WARN_NO_PACKAGE_NAME_OR_VERSION = {
    status: DownloadStatus.DOWNLOAD_WARN,
    message: "Safe-Chain wasn't able to extract package name and/or version."
}