// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as assert from 'assert';
import * as vscode from 'vscode';

import { activateExtension, getDocUri, open, testHover } from '../../helper';

suite('hover', () => {
  suite('core schema', function suite() {
    const docUri = getDocUri('main.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'opentofu', 'document language should be `opentofu`');
    });

    test('returns docs for terraform block', async () => {
      await testHover(docUri, new vscode.Position(0, 1), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '**terraform** _Block_\n\nTerraform block used to configure some high-level behaviors of Terraform',
          ),
          new vscode.Range(new vscode.Position(14, 12), new vscode.Position(14, 20)),
        ),
      ]);
    });
  });
});
