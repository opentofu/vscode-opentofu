# Used to test encryption block completion
terraform {
  encrypt
}

terraform {
  encryption {
    method "unencrypted" "migrate" {}
  }
}
