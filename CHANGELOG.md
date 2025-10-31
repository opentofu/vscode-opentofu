# Changelog

## v0.5.0 (2025-10-31)

*Includes a new LS version - [tofu-ls latest](https://github.com/opentofu/tofu-ls/releases/tag/vlatest)*

### Features
* Ephemeral block and attribute support

**Full Changelog**: https://github.com/opentofu/vscode-opentofu/compare/v0.4.2...v0.5.0

## 0.4.1 (2025-09-16)
- Fix: language server crashing on resources with no provider prefix
- Fix: Removes the `fallback` attribute from the fallback block
- Fix: Adds pseudo-recursive fallback blocks for encryption
- Internal: Dependency updates for security

## 0.4.0 (2025-09-11)
- Adds documentation links for `data_source` resources. 

## 0.3.5 (2025-08-15)
- Adds the `dynamic` block support inside the `provider` blocks.

## 0.3.4 (2025-07-07)
- Adding references to complex object variables

## 0.3.3 (2025-06-26)
- Matching `removed` block schema to OpenTofu implementation
- Adding references to provider for each on LSP
- Integration tests for encryption and resource provider for-each block
- Fixing a bug when passing `tofu` binary options

## 0.3.2 (2025-06-20)
- `encryption` block key providers now support all available options

## 0.3.1 (2025-06-19)
- displayName change to "OpenTofu (official)"
- Fixes LS binary options, "opentofu" -> "tofu"

## 0.3.0 (2025-06-19)
- Support for `encryption` block
- Support for provider `for_each`
- Documentation updates
- Small fixes and performance improvements