## Releasing

Releases are made on a reasonably regular basis by the maintainers, using the [vsce tool](https://github.com/microsoft/vscode-vsce). The following notes are only relevant to maintainers.

Release process:

1. Create a release branch/PR with the following changes:

   - Bump the language server version in `package.json` if the release should include a [LS update](https://github.com/opentofu/tofu-ls/releases)
   - Update the [CHANGELOG.md](../CHANGELOG.md) with the recent changes
   - Bump the version in `package.json` (and `package-lock.json`) by using `npm version X.Y.Z`. This automatically creates a git commit.
1. Review & merge the branch and wait for the [Test Workflow](https://github.com/opentofu/vscode-opentofu/actions/workflows/test.yml) on `main` to complete.
1. Go to the [Draft a new release page](https://github.com/opentofu/vscode-opentofu/releases/new);
1. Click on "Choose a tag", type "vX.Y.Z", then click on the "Create a new tag: vX.Y.Z" label;
1. Click on "Generate release notes" in order to add an auto-generated description and copy the CHANGELOG.md changes on the top of the description.
1. Click on "Publish Release" to finish the process. The `release.yml` workflow
will be triggered in response to this event.
