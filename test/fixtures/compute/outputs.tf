# Copyright (c) The OpenTofu Authors
# SPDX-License-Identifier: MPL-2.0
# Copyright (c) 2024 HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

output "ip" {
  value = google_compute_instance.vm_instance.network_interface[0].network_ip
}
