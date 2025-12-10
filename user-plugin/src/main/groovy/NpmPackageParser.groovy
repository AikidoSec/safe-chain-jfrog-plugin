class NpmPackageParser {
  static Map parseNpmPackageUrl(String urlPath) {
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
}
