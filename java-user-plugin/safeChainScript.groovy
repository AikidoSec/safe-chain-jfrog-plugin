import dev.aikido_plugins.safe_chain_jfrog.AltResponseHandler

download {
  altResponse { request, responseRepoPath ->
    // Validation logic here
    decision = AltResponseHandler.handleAltResponse(request, responseRepoPath)

    if (decision) {
      status = 403
      message = "blocked by safe-chain"
    }
  }
}
