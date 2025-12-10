import org.artifactory.api.context.*
import org.artifactory.exception.*
import groovy.transform.BaseScript

@BaseScript CustomScriptBase scriptBase

// Define the plugin
def plugin = context?.plugin ?: return

// Register the event listener
plugin.addEventListener(new Closure<Boolean>(this, this.&onBeforeDownload) as Object, "beforeDownload")

def onBeforeDownload(BeforeDownloadEvent event) {
  log.info("Intercepted download request for: ${event.request.remoteRepoName}")

  // Only proceed if this is a remote repo
  if (!event.request.remoteRepoName) {
    log.info("Not a remote repo, allowing download.")
    return true
  }

  // Only proceed for npm packages
  if (!event.request.repoPath.path.contains("/-/")) {
    log.info("Not an npm package, allowing download.")
    return true
  }

  // Parse package name and version
  def npmPackage = NpmPackageParser.parseNpmPackageUrl(event.request.repoPath.path)
  if (!npmPackage.packageName || !npmPackage.version) {
    log.warn("Could not parse package name/version, allowing download.")
    return true
  }

  log.info("Scanning package ${npmPackage.packageName}@${npmPackage.version}")

  // Fetch malware database
  def malwareDb = MalwareDatabase.openMalwareDatabase("js", new HttpClient())
  log.info("Loaded malware database version ${malwareDb.version}")

  // Check for malware
  if (malwareDb.isMalware(npmPackage.packageName, npmPackage.version)) {
    log.warn("Malware detected for ${npmPackage.packageName}@${npmPackage.version}, stopping download.")
    event.cancel = true
    event.error = new CancelException("Download stopped: malware detected.")
    return false
  }

  log.info("Package is safe, allowing download.")
  return true
}
