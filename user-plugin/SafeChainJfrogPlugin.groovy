import org.artifactory.api.context.*
import org.artifactory.exception.*
import org.artifactory.repo.*

// Define the plugin
def plugin = context.plugin ?

// Define the trigger for download events
plugin.addEventListener(new Closure<Boolean>(this, this.&onDownload) as Object, "beforeDownload")

// The logic to stop remote downloads
def onDownload(BeforeDownloadEvent event) {
    log.info("Intercepted download request for: ${event.request.remoteRepoName}")

    // Check if the request is for a remote repository
    if (event.request.remoteRepoName) {
        log.info("Blocking download from remote repository: ${event.request.remoteRepoName}")
        event.cancel = true
        event.error = new CancelException("Downloads from remote repositories are not allowed.")
        return false
    }

    return true
}

