// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2024 HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as tofu from '../api/opentofu/opentofu';
import * as vscode from 'vscode';

import { LanguageClient } from 'vscode-languageclient/node';

export class TofuCommands implements vscode.Disposable {
  private commands: vscode.Disposable[];

  constructor(private client: LanguageClient) {
    this.commands = [
      vscode.commands.registerCommand('tofu.init', async () => {
        await tofu.initAskUserCommand(this.client);
      }),
      vscode.commands.registerCommand('tofu.initCurrent', async () => {
        await tofu.initCurrentOpenFileCommand(this.client);
      }),
      vscode.commands.registerCommand('tofu.apply', async () => {
        await tofu.command('apply', this.client, true);
      }),
      vscode.commands.registerCommand('tofu.plan', async () => {
        await tofu.command('plan', this.client, true);
      }),
      vscode.commands.registerCommand('tofu.validate', async () => {
        await tofu.command('validate', this.client);
      }),
    ];
  }

  dispose() {
    this.commands.forEach((c) => c.dispose());
  }
}
