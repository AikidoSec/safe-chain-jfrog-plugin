// Import mock classes
import groovy.json.JsonSlurper

// Mock the event
def event = new MockBeforeDownloadEvent()
event.request = [
  remoteRepoName: "npm-remote",
  repoPath: new MockRepoPath(path: "lodash/-/lodash-4.17.21.tgz")
]
event.request.metadata = new MockDownloadMetadata(repoType: "REMOTE")

// Mock the malware database response
def mockMalwareDatabase = [
  [
    package_name: "lodash",
    version: "4.17.21",
    reason: "MALWARE"
  ]
]

// Mock the HTTP client to return the mock database
def mockHttpClient = [
  get: { String url ->
    if (url == "https://malware-list.aikido.dev/malware_predictions.json") {
      return [
        status: 200,
        data: mockMalwareDatabase,
        headers: ["ETag": "v1"]
      ]
    }
    return [status: 404, data: null, headers: [:]]
  }
] as Object


// paste code

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
  def npmPackage = parseNpmPackageUrl(event.request.repoPath.path)
  if (!npmPackage.packageName || !npmPackage.version) {
    log.warn("Could not parse package name/version, allowing download.")
    return true
  }

  log.info("Scanning package ${npmPackage.packageName}@${npmPackage.version}")

  // Fetch malware database
  def malwareDb = openMalwareDatabase("js")
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

// Helper function to parse npm package URL
def parseNpmPackageUrl(String urlPath) {
  def packageName, version
  def separatorIndex = urlPath.indexOf("/-/")
  if (separatorIndex == -1) {
    return [packageName: null, version: null]
  }
  packageName = urlPath.substring(0, separatorIndex)
  def filename = urlPath.substring(separatorIndex + 3, urlPath.length() - 4) // Remove /-/ and .tgz

  // Extract version from filename
  if (packageName.startsWith("@")) {
    def scopedPackageName = packageName.substring(packageName.lastIndexOf("/") + 1)
    if (filename.startsWith("${scopedPackageName}-")) {
      version = filename.substring(scopedPackageName.length() + 1)
    }
  } else {
    if (filename.startsWith("${packageName}-")) {
      version = filename.substring(packageName.length() + 1)
    }
  }
  return [packageName: packageName, version: version]
}

// Helper function to open malware database
def openMalwareDatabase(String ecosystem) {
  def url = "https://malware-list.aikido.dev/malware_predictions.json"
  def connection = new URL(url).openConnection()
  connection.setRequestMethod("GET")
  def responseCode = connection.responseCode
  if (responseCode != 200) {
    throw new Exception("Failed to fetch malware database: HTTP ${responseCode}")
  }
  def malwareDatabase = new groovy.json.JsonSlurper().parseText(connection.content.text)
  def malwareDbVersion = connection.headerFields['ETag'] ?: "unknown"

  def isMalwareClosure = { String name, String version ->
    def normalizedName = name.toLowerCase().replace(/[-_.]+/g, '-')
    def packageData = malwareDatabase.find { pkg ->
      def normalizedPkgName = pkg.package_name.toLowerCase().replace(/[-_.]+/g, '-')
      def isNameMatch = normalizedPkgName == normalizedName
      def isVersionMatch = pkg.version == version || pkg.version == '*'
      isNameMatch && isVersionMatch
    }
    return packageData && packageData.reason != 'OK'
  }

  return [version: malwareDbVersion, isMalware: isMalwareClosure]
}


// end paste code

// Run the test
onBeforeDownload(event)

if (event.cancel) {
  println("Download was cancelled: ${event.error?.message}")
} else {
  println("Download was allowed")
}
