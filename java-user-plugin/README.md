# Safe Chain JFrog - Build Instructions

## Building the Uber JAR

This project uses the Maven Shade Plugin to create an uber JAR that includes all runtime dependencies except for the JFrog/Artifactory dependencies (which are marked as `provided`).

### Build Command

```bash
mvn clean package
```

### Output

The uber JAR will be created at:
```
target/safe_chain_jfrog-0.1.0-uber.jar
```

### What's Included

- **Included**: `gson` library (runtime dependency)
- **Excluded**:
  - `artifactory-papi` (provided scope - will be available in JFrog runtime)
  - `junit-jupiter` (test scope)
  - META-INF signature files (to avoid conflicts)

### Configuration Details

The Maven Shade Plugin is configured to:
1. Create an uber JAR during the `package` phase
2. Exclude all `org.artifactory:*` dependencies
3. Exclude test dependencies
4. Remove signature files that can cause conflicts
5. Name the output file with `-uber` suffix

### Verify the JAR Contents

To verify what's inside the uber JAR:

```bash
jar tf target/safe_chain_jfrog-0.1.0-uber.jar
```

Or to check dependencies specifically:

```bash
mvn dependency:tree
```

### Notes

- The original non-shaded JAR will also be available as `safe_chain_jfrog-0.1.0.jar`
- The uber JAR includes relocated/shaded dependencies to avoid conflicts
- The JFrog Artifactory runtime environment will provide the `artifactory-papi` dependency