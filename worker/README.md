## worker technical details
There is currently no cache on the malware database, we pull it depending on ecosystem.
We set a listener on the `BEFORE_DOWNLOAD` jfrog event (see [docs](https://jfrog.com/help/r/jfrog-platform-administration-documentation/before-download-worker-code-sample)).

## deploying worker
Install jf
```shell
curl -fL https://getcli.jfrog.io/v2-jf | sh
mv jf /usr/local/bin
```

Create access token in UI and then run (decide server-id yoursele)
```shell
jf config add --url=<platform-url> --access-token="<platform-access-token>" --interactive=false <server-id>
```

dry-run worker
```shell
jf worker dry-run --server-id <server-id> '{}'
```

### Useful resources
- https://jfrog.com/blog/doing-devops-your-way-on-saas-solutions-connecting-jfrog-cli-to-your-jfrog-workers/
