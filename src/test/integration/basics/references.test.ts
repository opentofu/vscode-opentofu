// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2024 HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as assert from 'assert';
import * as vscode from 'vscode';

import { activateExtension, getDocUri, open, testReferences } from '../../helper';

suite('references', () => {
  suite('module references', function suite() {
    const docUri = getDocUri('variables.tf');

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

    test('returns definition for module source', async () => {
      await testReferences(docUri, new vscode.Position(12, 10), [
        new vscode.Location(
          getDocUri('main.tf'),
          new vscode.Range(new vscode.Position(14, 12), new vscode.Position(14, 20)),
        ),
        new vscode.Location(
          getDocUri('terraform.tfvars'),
          new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 4)),
        ),
      ]);
    });
  });

  suite('provider references', function suite() {
    const docUri = getDocUri('provider_foreach.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('provider alias references', async () => {
      // alias = by_region
      await testReferences(docUri, new vscode.Position(12, 10), [
        new vscode.Location(docUri, new vscode.Range(new vscode.Position(13, 13), new vscode.Position(13, 21))),
        new vscode.Location(docUri, new vscode.Range(new vscode.Position(18, 13), new vscode.Position(18, 26))),
        new vscode.Location(docUri, new vscode.Range(new vscode.Position(24, 13), new vscode.Position(24, 26))),
      ]);

      // alias = by_name
      await testReferences(docUri, new vscode.Position(29, 17), [
        new vscode.Location(docUri, new vscode.Range(new vscode.Position(36, 13), new vscode.Position(36, 24))),
      ]);
    });
  });
});
