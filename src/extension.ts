'use strict'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

import { ComputerTreeProvider } from './computer_view'


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(ctx: vscode.ExtensionContext): void {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Activated AiiDA-Repository extension')

    // get configuration options
    let configOptions: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('aiida')

    // register views
    const treeDataProvider = ComputerTreeProvider.getInstance(configOptions.get('connection'))
    vscode.window.registerTreeDataProvider('aiidaComputerCodes', treeDataProvider)

    // register commands
    vscode.commands.registerCommand('aiidaComputerCodes.refreshEntry', () =>
        treeDataProvider.refresh()
    )
    // vscode.commands.registerCommand('aiida.inspectComputer', inspectComputer)

    // register configuration change callback
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(
        (e: vscode.ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('aiida.connection')) {
                configOptions = vscode.workspace.getConfiguration('aiida')
                treeDataProvider.config = configOptions.get('connection')
                treeDataProvider.connectionTimeout = configOptions.get('connection.timeout_ms')
                treeDataProvider.refresh()
            }
        }))
}

// this method is called when your extension is deactivated
export function deactivate() {
}
