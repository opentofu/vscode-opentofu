# Copyright (c) The OpenTofu Authors
# SPDX-License-Identifier: MPL-2.0
# Copyright (c) 2024 HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

require 'json'

module LambdaFunctions
  class Handler
    def self.process(event:,context:)
      nameQuery = event.dig("queryStringParameters", "name")
      name = nameQuery || "World"

      {
        statusCode: 200,
        headers: {
          'Content-Type' => 'text/plain'
        },
        body: "Hello, #{name}!",
      }
    end
  end
end
