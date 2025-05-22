// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as assert from 'assert';
import * as vscode from 'vscode';

import { activateExtension, getDocUri, open, testDefinitions } from '../../helper';

suite('definitions', () => {
  suite('go to module definition', function suite() {
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

    test('returns definition for module source', async () => {
      const location = new vscode.Location(
        getDocUri('compute/main.tf'),
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      );

      // module "compute" {
      //   source = "./compute"
      await testDefinitions(docUri, new vscode.Position(18, 11), [location]);
    });

    test('returns definition for module attribute', async () => {
      const location = new vscode.Location(
        getDocUri('compute/variables.tf'),
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(3, 1)),
      );

      // module "compute" {
      //   source = "./compute"
      //   instance_name = "terraform-machine"
      await testDefinitions(docUri, new vscode.Position(20, 2), [location]);
    });

    test('returns definition for variable', async () => {
      // provider "google" {
      //   credentials = file(var.credentials_file)
      //   project = var.project
      //   region  = var.region
      //   zone    = var.zone
      const location = new vscode.Location(
        getDocUri('variables.tf'),
        new vscode.Range(new vscode.Position(4, 0), new vscode.Position(6, 1)),
      );

      await testDefinitions(docUri, new vscode.Position(10, 36), [location]);
    });
  });

  suite('go to variable definition', function suite() {
    const docUri = getDocUri('terraform.tfvars');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'opentofu-vars', 'document language should be `opentofu-vars`');
    });

    test('returns definition for module source', async () => {
      const location = new vscode.Location(
        getDocUri('variables.tf'),
        new vscode.Range(new vscode.Position(12, 0), new vscode.Position(14, 1)),
      );

      // module "compute" {
      //   source = "./compute"
      await testDefinitions(docUri, new vscode.Position(0, 1), [location]);
    });
  });
});
