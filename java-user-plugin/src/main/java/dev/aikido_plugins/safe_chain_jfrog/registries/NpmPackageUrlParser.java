package dev.aikido_plugins.safe_chain_jfrog.registries;

public class NpmPackageUrlParser {

  public record ParsedNpmPackage(String packageName, String version) {}

  public static ParsedNpmPackage parseNpmPackageUrl(String urlPath) {
    String packageName = null;
    String version = null;

    int separatorIndex = urlPath.indexOf("/-/");
    if (separatorIndex == -1) {
      return new ParsedNpmPackage(packageName, version);
    }

    packageName = urlPath.substring(0, separatorIndex);
    String filename = urlPath.substring(
      separatorIndex + 3,
      urlPath.length() - 4
    ); // Remove /-/ and .tgz

    // Extract version from filename
    if (packageName.startsWith("@")) {
      String scopedPackageName = packageName.substring(
        packageName.lastIndexOf("/") + 1
      );
      if (filename.startsWith(scopedPackageName + "-")) {
        version = filename.substring(scopedPackageName.length() + 1);
      }
    } else {
      if (filename.startsWith(packageName + "-")) {
        version = filename.substring(packageName.length() + 1);
      }
    }

    return new ParsedNpmPackage(packageName, version);
  }
}
