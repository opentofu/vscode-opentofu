// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2024 HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as assert from 'assert';
import * as vscode from 'vscode';

import { activateExtension, getDocUri, open, testHover, testReferences } from '../../helper';

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

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'opentofu', 'document language should be `opentofu`');
    });

    // Creating this test for testing the alias provider reference and if for_each argument is shown without errors
    test('hovering for-each attribute at provider', async () => {
      await testHover(docUri, new vscode.Position(12, 2), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '**for_each** _optional, map of any single type or set of string or object_\n\nA meta-argument that accepts a map or a set of strings, and creates an instance for each item in that map or set.\n\n**Note**: A given block cannot use both `count` and `for_each`.',
          ),
          new vscode.Range(new vscode.Position(12, 2), new vscode.Position(12, 35)),
        ),
      ]);
    });
  });

  suite.skip('provider alias reference', async () => {});
});
