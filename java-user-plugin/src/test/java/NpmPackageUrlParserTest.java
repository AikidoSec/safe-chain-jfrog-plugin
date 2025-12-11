import dev.aikido_plugins.safe_chain_jfrog.registries.NpmPackageUrlParser;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class NpmPackageUrlParserTest {

  @Test
  public void testParseScopedPackage() {
    String urlPath = "@babel/core/-/core-7.21.4.tgz";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertEquals("@babel/core", result.packageName());
    assertEquals("7.21.4", result.version());
  }

  @Test
  public void testParseRegularPackage() {
    String urlPath = "lodash/-/lodash-4.17.21.tgz";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertEquals("lodash", result.packageName());
    assertEquals("4.17.21", result.version());
  }

  @Test
  public void testParseInvalidUrlNoSeparator() {
    String urlPath = "lodash-4.17.21.tgz";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertNull(result.packageName());
    assertNull(result.version());
  }

  @Test
  public void testParseEmptyUrl() {
    String urlPath = "";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertNull(result.packageName());
    assertNull(result.version());
  }

  @Test
  public void testParseScopedPackageWithComplexName() {
    String urlPath = "@angular/animations/-/animations-15.2.0.tgz";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertEquals("@angular/animations", result.packageName());
    assertEquals("15.2.0", result.version());
  }

  @Test
  public void testParseRegularPackageWithComplexName() {
    String urlPath = "react-dom/-/react-dom-18.2.0.tgz";
    NpmPackageUrlParser.ParsedNpmPackage result = NpmPackageUrlParser.parseNpmPackageUrl(urlPath);
    assertEquals("react-dom", result.packageName());
    assertEquals("18.2.0", result.version());
  }
}
