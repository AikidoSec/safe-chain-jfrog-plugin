# safe-chain-jfrog-plugin
There are two possibilites to deploy safe-chain checks to JFrog:
- As a User Plugin (recommended)
- As an Artifactory Worker (requires Enterprise & JFrog Advanced Security)

## Installing Safe Chain as a user plugin
### How it works
This plugin will double check your npm packages before downloading given that the repository :
- is a remote repository
- and the repository's package type is npm

### How to Install
Go to the latest release page and download the safe-chain jar and groovy script, then :
- Place the groovy script in your `$JFROG_HOME/artifactory/var/etc/artifactory/plugins` directory.
- Place the jar file in your `$JFROG_HOME/artifactory/var/etc/artifactory/plugins/lib` directory.
If you are not hosting JFrog Artifactory yourself, Contact JFrog to do this for you.

### See also
- https://jfrog.com/help/r/jfrog-integrations-documentation/deploy-plugins
