/**
 * org.artifactory definitions can be found here :
 * https://releases.jfrog.io/artifactory/oss-releases-virtual/org/artifactory/artifactory-papi/%5BRELEASE%5D/artifactory-papi-%5BRELEASE%5D-javadoc.jar!/index.html
 */
package dev.aikido_plugins.safe_chain_jfrog;

import dev.aikido_plugins.safe_chain_jfrog.database.MalwareDatabase;
import dev.aikido_plugins.safe_chain_jfrog.database.MalwareDatabaseFetcher;
import dev.aikido_plugins.safe_chain_jfrog.registries.NpmPackageUrlParser;
import org.artifactory.repo.RepoPath;
import org.artifactory.repo.Repositories;
import org.artifactory.repo.RepositoryConfiguration;
import org.artifactory.request.Request;

import static dev.aikido_plugins.safe_chain_jfrog.registries.NpmPackageUrlParser.parseNpmPackageUrl;

public class AltResponseHandler {
  public static boolean handleAltResponse(Request request, RepoPath responseRepoPath, Repositories repositories) {
    System.out.println("[safe-chain] starting analysis");

    String path = responseRepoPath.getPath();
    if (path == null) {
      return false;
    }

    String repoKey = responseRepoPath.getRepoKey();
    if (!isRemoteRepository(repoKey, repositories)) {
      // we only perform safe-chain checks for remote repositories
      return false;
    }


    String packageType = getPackageType(repoKey, repositories);
    boolean isNpm = packageType.toLowerCase().contains("npm");
    boolean isPypi = packageType.toLowerCase().contains("pypi");

    if (!isNpm && !isPypi) {
      System.out.println("[safe-chain] skipping analysis - not a remote npm or pypi repository");
      return false;
    }

    if (isPypi) {
      // not supported at this point.
      return false;
    }

    NpmPackageUrlParser.ParsedNpmPackage pkg = parseNpmPackageUrl(path);
    if (pkg.packageName() == null || pkg.version() == null) {
      System.out.println("[safe-chain] unable to parse npm package from path: " + path);
      return false;
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
        return true;
      } else {
        System.out.println("[safe-chain] package is safe: " + pkg.packageName() + "@" + pkg.version());
        return false;
      }

    } catch (Exception e) {
      System.err.println("[safe-chain] error fetching malware database: " + e.getMessage());
      return false;
    }
  }

  private static boolean isRemoteRepository(String repoKey, Repositories repositories) {
    if (repoKey.endsWith("-cache")) {
      repoKey = repoKey.substring(0, repoKey.length() - 6);
    }
    return repositories.getRemoteRepositories().contains(repoKey);
  }

  private static String getPackageType(String repoKey, Repositories repositories) {
    RepositoryConfiguration config = repositories.getRepositoryConfiguration(repoKey);
    return config.getPackageType();
  }
}
