## Releasing

Releases are made on a reasonably regular basis by the maintainers, using the [vsce tool](https://github.com/microsoft/vscode-vsce). The following notes are only relevant to maintainers.

Release process:

1. Once everything we need to include in the release is on the _main_ branch, trigger the "Prepare Release" workflow.

   - Depending on which type of release we are doing, select either: major, minor or patch.
   - If the release should include a `tofu-ls` version update, set the `ls-version` input, e.g., 0.1.0, latest, etc.

1. Once the workflow is finished, review the PR it created. Make adjustments if necessary and merge it.

That is the whole flow. Once the PR is merged, the `Release` workflow will be triggered automatically.
