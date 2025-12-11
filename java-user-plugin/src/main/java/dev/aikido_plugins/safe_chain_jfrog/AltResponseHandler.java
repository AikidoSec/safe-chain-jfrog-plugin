package dev.aikido_plugins.safe_chain_jfrog;

import org.artifactory.repo.RepoPath;
import org.artifactory.request.Request;

public class AltResponseHandler {
  public record Decision(int status, String text) {}

  public static Decision handleAltResponse(Request request, RepoPath responseRepoPath) {
    return null;
  }
}
