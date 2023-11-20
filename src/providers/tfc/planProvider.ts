/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as readline from 'readline';
import { Writable } from 'stream';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';

import { apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import { apiErrorsToString } from '../../terraformCloud/errors';
import { handleAuthError, handleZodiosError } from './uiHelpers';
import { GetDiagnosticSeverityIcon, GetChangeActionIcon, GetDriftChangeActionMessage } from './helpers';
import {
  Change,
  ChangeSummary,
  Diagnostic,
  DriftSummary,
  LogLine,
  OutputChange,
  Outputs,
} from '../../terraformCloud/log';
import { PlanTreeItem } from './runProvider';

export class PlanTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private plan: PlanTreeItem | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.run.plan.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-run-plan-refresh');
        this.refresh(this.plan);
      }),
    );
  }

  refresh(plan?: PlanTreeItem): void {
    this.plan = plan;
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!this.plan) {
      return [];
    }

    if (!element) {
      try {
        return this.getRootChildren(this.plan);
      } catch (error) {
        return [];
      }
    }

    if (isItemWithChildren(element)) {
      return element.getChildren();
    }
  }

  private async getRootChildren(plan: PlanTreeItem): Promise<vscode.TreeItem[]> {
    const planLog = await this.getPlanFromUrl(plan);

    const items: vscode.TreeItem[] = [];
    if (planLog && planLog.plannedChanges) {
      items.push(new PlannedChangesItem(planLog.plannedChanges, planLog.changeSummary));
    }
    if (planLog && planLog.driftChanges) {
      items.push(new DriftChangesItem(planLog.driftChanges, planLog.driftSummary));
    }
    if (planLog && planLog.outputs) {
      items.push(new OutputsItem(planLog.outputs));
    }
    if (planLog && planLog.diagnostics && planLog.diagnosticSummary && planLog.diagnostics.length > 0) {
      items.push(new DiagnosticsItem(planLog.diagnostics, planLog.diagnosticSummary));
    }
    return items;
  }

  private async getPlanFromUrl(plan: PlanTreeItem): Promise<PlanLog | undefined> {
    const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
      createIfNone: false,
    });

    if (session === undefined) {
      return;
    }

    try {
      const result = await axios.get(plan.logReadUrl, {
        headers: { Accept: 'text/plain' },
        responseType: 'stream',
      });
      const lineStream = readline.createInterface({
        input: result.data,
        output: new Writable(),
      });

      const planLog: PlanLog = {};

      for await (const line of lineStream) {
        try {
          const logLine: LogLine = JSON.parse(line);

          if (logLine.type === 'planned_change' && logLine.change) {
            if (!planLog.plannedChanges) {
              planLog.plannedChanges = [];
            }
            planLog.plannedChanges.push(logLine.change);
            continue;
          }
          if (logLine.type === 'resource_drift' && logLine.change) {
            if (!planLog.driftChanges) {
              planLog.driftChanges = [];
            }
            if (!planLog.driftSummary) {
              planLog.driftSummary = {
                changed: 0,
                deleted: 0,
              };
            }
            planLog.driftChanges.push(logLine.change);
            if (logLine.change.action === 'update') {
              planLog.driftSummary.changed += 1;
            }
            if (logLine.change.action === 'delete') {
              planLog.driftSummary.deleted += 1;
            }
            continue;
          }
          if (logLine.type === 'change_summary' && logLine.changes) {
            planLog.changeSummary = logLine.changes;
            continue;
          }
          if (logLine.type === 'outputs' && logLine.outputs) {
            planLog.outputs = logLine.outputs;
            continue;
          }
          if (logLine.type === 'diagnostic' && logLine.diagnostic) {
            if (!planLog.diagnostics) {
              planLog.diagnostics = [];
            }
            if (!planLog.diagnosticSummary) {
              planLog.diagnosticSummary = {
                errorCount: 0,
                warningCount: 0,
              };
            }
            planLog.diagnostics.push(logLine.diagnostic);
            if (logLine.diagnostic.severity === 'warning') {
              planLog.diagnosticSummary.warningCount += 1;
            }
            if (logLine.diagnostic.severity === 'error') {
              planLog.diagnosticSummary.errorCount += 1;
            }
            continue;
          }

          // TODO: logLine.type=test_*
        } catch (e) {
          // skip any non-JSON lines, like Terraform version output
          continue;
        }
      }

      return planLog;
    } catch (error) {
      let message = `Failed to obtain plan from ${plan.logReadUrl}: `;

      if (error instanceof ZodiosError) {
        handleZodiosError(error, message, this.outputChannel, this.reporter);
        return;
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          handleAuthError();
          return;
        }

        if (isErrorFromAlias(apiClient.api, 'listRuns', error)) {
          message += apiErrorsToString(error.response.data.errors);
          vscode.window.showErrorMessage(message);
          this.reporter.sendTelemetryException(error);
          return;
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryException(error);
        return;
      }

      if (typeof error === 'string') {
        message += error;
      }
      vscode.window.showErrorMessage(message);
      return;
    }
  }

  dispose() {
    //
  }
}

interface PlanLog {
  plannedChanges?: Change[];
  changeSummary?: ChangeSummary;
  driftChanges?: Change[];
  driftSummary?: DriftSummary;
  outputs?: Outputs;
  diagnostics?: Diagnostic[];
  diagnosticSummary?: DiagnosticSummary;
}

interface ItemWithChildren {
  getChildren(): vscode.TreeItem[];
}

function isItemWithChildren(element: object): element is ItemWithChildren {
  return 'getChildren' in element;
}

class PlannedChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private plannedChanges: Change[], summary?: ChangeSummary) {
    let label = 'Planned changes';
    if (summary) {
      const labels: string[] = [];
      if (summary.import > 0) {
        labels.push(`${summary.import} to import`);
      }
      if (summary.add > 0) {
        labels.push(`${summary.add} to add`);
      }
      if (summary.change > 0) {
        labels.push(`${summary.change} to change`);
      }
      if (summary.remove > 0) {
        labels.push(`${summary.remove} to destroy`);
      }
      if (labels.length > 0) {
        label = `Planned changes: ${labels.join(', ')}`;
      }
    }
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.plannedChanges.map((change) => new PlannedChangeItem(change));
  }
}

class PlannedChangeItem extends vscode.TreeItem {
  constructor(public change: Change) {
    let label = change.resource.addr;
    if (change.previous_resource) {
      label = `${change.previous_resource.addr} → ${change.resource.addr}`;
    }

    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = change.action + '/' + change.resource.addr;
    this.iconPath = GetChangeActionIcon(change.action);
    this.description = change.action;

    const tooltip = new vscode.MarkdownString();
    if (change.previous_resource) {
      tooltip.appendMarkdown(
        `\`${change.previous_resource.addr}\` planned to _${change.action}_ to \`${change.resource.addr}\``,
      );
    } else if (change.importing) {
      tooltip.appendMarkdown(
        `Planned to _${change.action}_ \`${change.resource.addr}\` (id=\`${change.importing.id}\`)`,
      );
    } else {
      tooltip.appendMarkdown(`Planned to _${change.action}_ \`${change.resource.addr}\``);
    }
    this.tooltip = tooltip;
  }
}

class DriftChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private driftChanges: Change[], summary?: DriftSummary) {
    let label = `Drifted resources`;
    if (summary) {
      const details = [];
      if (summary.changed > 0) {
        details.push(`${summary.changed} changed`);
      }
      if (summary.deleted > 0) {
        details.push(`${summary.deleted} deleted`);
      }
      label = `Drifted resources: ${details.join(', ')}`;
    }

    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.driftChanges.map((change) => new DriftChangeItem(change));
  }
}

class DriftChangeItem extends vscode.TreeItem {
  constructor(public change: Change) {
    let label = change.resource.addr;
    if (change.previous_resource) {
      label = `${change.previous_resource.addr} → ${change.resource.addr}`;
    }

    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = 'drift/' + change.action + '/' + change.resource.addr;
    this.iconPath = GetChangeActionIcon(change.action);
    const message = GetDriftChangeActionMessage(change.action);
    this.description = message;
    this.tooltip = new vscode.MarkdownString(`\`${change.resource.addr}\` _${message}_`);
  }
}

class OutputChangeItem extends vscode.TreeItem {
  constructor(name: string, output: OutputChange) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.id = 'output/' + output.action + '/' + name;
    this.iconPath = GetChangeActionIcon(output.action);
    this.description = output.action;
    if (output.sensitive) {
      this.description += ' (sensitive)';
    }
  }
}

class OutputsItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private outputs: Outputs) {
    super(`${outputs.size} outputs`, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];
    Object.entries(this.outputs).forEach(([name, change]: [string, OutputChange]) => {
      items.push(new OutputChangeItem(name, change));
    });
    return items;
  }
}

class DiagnosticsItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private diagnostics: Diagnostic[], summary: DiagnosticSummary) {
    const labels: string[] = [];
    if (summary.warningCount === 1) {
      labels.push(`1 warning`);
    } else if (summary.warningCount > 1) {
      labels.push(`${summary.warningCount} warnings`);
    }
    if (summary.errorCount === 1) {
      labels.push(`1 error`);
    } else if (summary.errorCount > 1) {
      labels.push(`${summary.errorCount} errors`);
    }
    super(labels.join(', '), vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.diagnostics.map((diagnostic) => new DiagnosticItem(diagnostic));
  }
}

class DiagnosticItem extends vscode.TreeItem {
  constructor(diagnostic: Diagnostic) {
    super(diagnostic.summary, vscode.TreeItemCollapsibleState.None);
    this.description = diagnostic.severity;
    const icon = GetDiagnosticSeverityIcon(diagnostic.severity);
    this.iconPath = icon;

    const tooltip = new vscode.MarkdownString();
    tooltip.supportThemeIcons = true;
    tooltip.appendMarkdown(`$(${icon.id}) **${diagnostic.summary}**\n\n`);
    tooltip.appendMarkdown(diagnostic.detail);
    this.tooltip = tooltip;
  }
}

interface DiagnosticSummary {
  errorCount: number;
  warningCount: number;
}
