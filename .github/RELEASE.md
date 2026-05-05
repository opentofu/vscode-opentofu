## Releasing

Releases are made on a reasonably regular basis by the maintainers, using the [vsce tool](https://github.com/microsoft/vscode-vsce). The following notes are only relevant to maintainers.

1. Create a PR against `main` with the following changes:
   - Set the new version in `package.json`:
     ```shell
     npm version patch|minor|major --no-git-tag-version
     ```
   - Optionally update `langServer.version` in `package.json` if including a new `tofu-ls` version.
   - Update `CHANGELOG.md` with the release notes for the new version.

1. Review and merge the PR.

1. [Create and publish a GitHub release](https://github.com/opentofu/vscode-opentofu/releases/new) with tag `vX.Y.Z`, using the changelog entry as the release body.

The [release workflow](workflows/release.yml) will automatically build the extension for all platforms and publish to the VS Code Marketplace and Open VSX Registry.
