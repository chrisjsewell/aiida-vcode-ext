'use strict'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

import { NodeDependenciesProvider } from './tree_view'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Activated AiiDA-Repository extension')

    const treeDataProvider = new NodeDependenciesProvider('/Users/cjs14/GitHub/aiida-vcode-ext')
    vscode.window.registerTreeDataProvider('aiidaRepository', treeDataProvider)

    vscode.commands.registerCommand('aiidaRepository.refreshEntry', () =>
        treeDataProvider.refresh()
    )
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// vscode.window.createTreeView('aiidaRepository', {
//     treeDataProvider: new NodeDependenciesProvider('/Users/cjs14/GitHub/aiida-vcode-ext')
// })
