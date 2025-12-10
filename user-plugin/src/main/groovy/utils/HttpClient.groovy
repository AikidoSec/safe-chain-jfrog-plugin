package utils

import groovy.json.JsonSlurper

class HttpClient {
  Map get(String url) {
    def connection = new URL(url).openConnection()
    connection.setRequestMethod("GET")
    def responseCode = connection.responseCode
    def responseData = responseCode == 200 ? new JsonSlurper().parseText(connection.content.text) : null
    def headers = connection.headerFields
    return [status: responseCode, data: responseData, headers: headers]
  }
}
