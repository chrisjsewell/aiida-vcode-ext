'use strict'

import * as crypto from 'crypto'
import { isNullOrUndefined } from 'util'

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Configuration } from 'ts-postgres'

import { ComputerTreeProvider } from './computer_view'
import { GroupTreeProvider } from './group_view'
import { ProcessTreeProvider } from './process_view'
import { MiscTreeProvider } from './settings_view'
import { inspectComputer, inspectNode, inspectGroup, inspectProcess, inspectProcessLogs } from './inspect'
import { Database } from './postgres'
import { setProfile } from './set_profile'

export let contentProvider: ReadOnlyContentProvider | undefined
const scheme: string = 'aiidaReadonly'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(ctx: vscode.ExtensionContext): void {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Activated AiiDA-Repository extension')

    // get configuration options
    let configOptions: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('aiida')

    // setup connection to database
    const db = Database.getInstance(configOptions.get('database'), configOptions.get('database.timeout_ms'))

    // register views
    const ComputerTreeInstance = ComputerTreeProvider.getInstance()
    vscode.window.registerTreeDataProvider('aiidaComputerCodes', ComputerTreeInstance)
    const GroupTreeInstance = GroupTreeProvider.getInstance()
    vscode.window.registerTreeDataProvider('aiidaGroupNodes', GroupTreeInstance)
    const ProcessTreeInstance = ProcessTreeProvider.getInstance()
    vscode.window.registerTreeDataProvider('aiidaProcess', ProcessTreeInstance)
    const MiscTreeInstance = MiscTreeProvider.getInstance()
    vscode.window.registerTreeDataProvider('aiidaSettings', MiscTreeInstance)

    // register text document provider for data inspection
    contentProvider = new ReadOnlyContentProvider()
    ctx.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(scheme, contentProvider))

    // register commands
    vscode.commands.registerCommand('aiidaComputerCodes.refreshEntry', () =>
        ComputerTreeInstance.refresh()
    )
    vscode.commands.registerCommand('aiidaGroupNodes.refreshEntry', () =>
        GroupTreeInstance.refresh()
    )
    vscode.commands.registerCommand('aiidaProcess.refreshEntry', () =>
        ProcessTreeInstance.refresh()
    )
    vscode.commands.registerCommand('aiidaProcess.toggleGroupBy', () =>
        ProcessTreeInstance.toggleGroupBy()
    )
    vscode.commands.registerCommand('aiidaSettings.refreshEntry', () =>
        MiscTreeInstance.refresh()
    )
    vscode.commands.registerCommand('aiida.inspectComputer', inspectComputer)
    vscode.commands.registerCommand('aiida.inspectNode', inspectNode)
    vscode.commands.registerCommand('aiida.inspectProcess', inspectProcess)
    vscode.commands.registerCommand('aiida.inspectProcessLogs', inspectProcessLogs)
    vscode.commands.registerCommand('aiida.inspectGroup', inspectGroup)

    vscode.commands.registerCommand('aiida.setProfile', setProfile)

    // register configuration change callback
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(
        (e: vscode.ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('aiida.database')) {
                configOptions = vscode.workspace.getConfiguration('aiida')
                const config = configOptions.get('database')
                const timeout = configOptions.get('database.timeout_ms')
                db.config = config ? config as Configuration : {}
                db.timeoutMs = timeout ? timeout as number : 1000
                ComputerTreeInstance.refresh()
                GroupTreeInstance.refresh()
                ProcessTreeInstance.refresh()
                MiscTreeInstance.refresh()
            }
            if (e.affectsConfiguration('aiida.query_max')) {
                configOptions = vscode.workspace.getConfiguration('aiida')
                const queryMax = configOptions.get('query_max')
                db.queryMaxRecords = queryMax ? queryMax as number : 10000
            }
        }))
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// see https://code.visualstudio.com/api/extension-guides/virtual-documents
class ReadOnlyContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChangeEmitter: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter<vscode.Uri>()
    private _contentMap: Map<string, string> = new Map<string, string>()

    public get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChangeEmitter.event
    }

    public async openReadOnlyContent(node: { label: string, fullId: string }, content: string, fileExtension: string): Promise<void> {
        const idHash: string = getPseudononymousStringHash(node.fullId, 'hex')
        const uri: vscode.Uri = vscode.Uri.parse(`${scheme}:///${idHash}/${node.label}${fileExtension}`)
        this._contentMap.set(uri.toString(), content)
        const doc = await vscode.workspace.openTextDocument(uri)
        await vscode.window.showTextDocument(doc)
        this._onDidChangeEmitter.fire(uri)
    }

    public provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): string {
        return nonNullValue(this._contentMap.get(uri.toString()), 'ReadOnlyContentProvider._contentMap.get')
    }
}

export function getPseudononymousStringHash(s: string, encoding: crypto.HexBase64Latin1Encoding = 'base64'): string {
    return crypto.createHash('sha256').update(s).digest(encoding)
}

/**
 * Validates that a given value is not null and not undefined.
 */
export function nonNullValue<T>(value: T | undefined, propertyNameOrMessage?: string): T {
    if (isNullOrUndefined(value)) {
        throw new Error(
            // tslint:disable-next-line:prefer-template
            'Internal error: Expected value to be neither null nor undefined'
            + (propertyNameOrMessage ? `: ${propertyNameOrMessage}` : ''))
    }

    return value
}
