# safe-chain-jfrog-plugin
Project currently consists of a JFrog Artifactory Worker (see `worker/`). While it was also possible to build this as a
JFrog User Plugin, the Workers are more flexible and the memory/cpu constraints are all met.

## worker technical details
There is currently no cache on the malware database, we pull it depending on ecosystem.
We set a listener on the `BEFORE_DOWNLOAD` jfrog event (see [docs](https://jfrog.com/help/r/jfrog-platform-administration-documentation/before-download-worker-code-sample)).
