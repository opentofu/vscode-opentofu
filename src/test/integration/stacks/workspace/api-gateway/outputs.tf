# Copyright (c) The OpenTofu Authors
# SPDX-License-Identifier: MPL-2.0
# Copyright (c) 2024 HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

output "hello_url" {
   description = "URL for invoking our Lambda function"

   value = aws_apigatewayv2_stage.lambda.invoke_url
}
