## Releasing

Releases are made on a reasonably regular basis by the maintainers, using the [vsce tool](https://github.com/microsoft/vscode-vsce). The following notes are only relevant to maintainers.

Release process:

1. Create a release branch/PR with the following changes:

   - Bump the language server version in `package.json` if the release should include a [LS update](https://github.com/opentofu/tofu-ls/releases)
   - Update the [CHANGELOG.md](../CHANGELOG.md) with the recent changes
   - Bump the version in `package.json` (and `package-lock.json`) by using `npm version 2.X.Y`
2. Create a Pull Request against main with the changes from this branch.
3. After the branch is merged, go to the [Draft a new release page](https://github.com/opentofu/vscode-opentofu/releases/new);
4. Click on "Choose a tag", type "vX.Y.Z", then click on the "Create a new tag: vX.Y.Z" label;
5. Click on "Generate release notes" in order to add an auto-generated description.
6. Click on "Publish Release" to finish the process. The `release.yml` workflow
will be triggered in response to this event.