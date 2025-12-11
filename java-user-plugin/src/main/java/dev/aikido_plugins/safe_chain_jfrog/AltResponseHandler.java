package dev.aikido_plugins.safe_chain_jfrog;

import dev.aikido_plugins.safe_chain_jfrog.database.MalwareDatabase;
import dev.aikido_plugins.safe_chain_jfrog.database.MalwareDatabaseFetcher;
import dev.aikido_plugins.safe_chain_jfrog.registries.NpmPackageUrlParser;
import org.artifactory.repo.RepoPath;
import org.artifactory.request.Request;

import static dev.aikido_plugins.safe_chain_jfrog.registries.NpmPackageUrlParser.parseNpmPackageUrl;

public class AltResponseHandler {
  public static Decision handleAltResponse(Request request, RepoPath responseRepoPath) {
    System.out.println("[safe-chain] starting analysis");

    String repoKey = responseRepoPath.getRepoKey();

    // Check if it's a remote repository (contains "-remote" or similar pattern)
    boolean isRemote = repoKey.toLowerCase().contains("remote");

    // Determine package type based on repository key
    boolean isNpm = repoKey.toLowerCase().contains("npm");
    boolean isPypi = repoKey.toLowerCase().contains("pypi");

    if ((!isNpm && !isPypi) || !isRemote) {
      System.out.println("[safe-chain] skipping analysis - not a remote npm or pypi repository");
      return null;
    }

    String path = responseRepoPath.getPath();
    if (path == null) {
      return null;
    }

    if (isPypi) {
      // not supported at this point.
      return null;
    }

    NpmPackageUrlParser.ParsedNpmPackage pkg = parseNpmPackageUrl(path);
    if (pkg.packageName() == null || pkg.version() == null) {
      System.out.println("[safe-chain] unable to parse npm package from path: " + path);
      return null;
    }

    System.out.println("[safe-chain] analyzing npm package: " + pkg.packageName() + "@" + pkg.version());
    try {
      MalwareDatabase npmDatabase = new MalwareDatabaseFetcher().fetchMalwareDatabase("js");

      boolean isMalicious = npmDatabase.isMalware(pkg.packageName(), pkg.version());
      if (isMalicious) {
        String message = String.format(
          "Package %s@%s has been blocked by Aikido safe-chain: flagged as malware",
          pkg.packageName(),
          pkg.version()
        );
        System.out.println("[safe-chain] BLOCKED: " + message);
        return new Decision(403, "blocked by safe-chain");
      } else {
        System.out.println("[safe-chain] package is safe: " + pkg.packageName() + "@" + pkg.version());
        return null;
      }

    } catch (Exception e) {
      System.err.println("[safe-chain] error fetching malware database: " + e.getMessage());
      return null;
    }
  }

  public record Decision(int status, String text) {
  }
}
