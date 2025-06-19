// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2024 HashiCorp, Inc.
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

    test('returns docs for opentofu block', async () => {
      await testHover(docUri, new vscode.Position(0, 1), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '**terraform** _Block_\n\n`terraform` block used to configure some high-level behaviors of OpenTofu',
          ),
          new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 9)),
        ),
      ]);
    });
  });

  suite('encryption block', function suite() {
    const docUri = getDocUri('encryption.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('returns docs for encryption block', async () => {
      await testHover(docUri, new vscode.Position(6, 9), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '**encryption** _Block, max: 1_\n\nState and Plan encryption configuration block\n\n[`encryption` on opentofu.org](https://opentofu.org/docs/language/state/encryption/#configuration)',
          ),
          new vscode.Range(new vscode.Position(6, 2), new vscode.Position(6, 12)),
        ),
      ]);
    });
  });
});
