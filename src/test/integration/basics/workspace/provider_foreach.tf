variable "aws_active_regions" {
  type    = set(string)
  default = ["us-east-1", "sa-east-1"]
}
variable "aws_disabled_regions" {
  description = "A list of regions that should be disabled and all resources removed."
  type        = set(string)
  default     = []
}
// Superset of the provider configuration
provider "aws" {
  alias    = "by_region"
  for_each = var.aws_active_regions
  region   = each.key
}
// Resource using a subset of the provider's configuration
resource "aws_cloudwatch_log_group" "lambda_cloudfront" {
  name     = "/aws/lambda/${each.key}.lambda"
  provider = aws.by_region[each.key]
  for_each = setsubtract(var.aws_active_regions, var.aws_disabled_regions)
}

module "ai" {
  source = "./ai"

  providers = aws.by_region[each.key]
  for_each  = setsubtract(var.aws_active_regions, var.aws_disabled_regions)
}
