'use strict'
import * as vscode from 'vscode'
import * as lodash from 'lodash'

import * as postgres from './postgres'
import { ComputerTreeItem, NodeTreeItem } from './tree_items'


export class ComputerTreeProvider implements vscode.TreeDataProvider<ComputerTreeItem> {

    // here we make the provider a singleton, so we can refer to it elsewhere
    private static instance: ComputerTreeProvider
    static getInstance(): ComputerTreeProvider {
        if (!ComputerTreeProvider.instance) {
            ComputerTreeProvider.instance = new ComputerTreeProvider()
        }
        return ComputerTreeProvider.instance
    }
    private constructor() {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ComputerTreeItem | undefined> = new vscode.EventEmitter<ComputerTreeItem | undefined>()
    readonly onDidChangeTreeData: vscode.Event<ComputerTreeItem | undefined>
    private computerCodes: { [key: number]: postgres.Computer } = {}

    refresh() {
        this._onDidChangeTreeData.fire(undefined)
    }

    getTreeItem(element: ComputerTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: ComputerTreeItem | NodeTreeItem): Promise<ComputerTreeItem[] | NodeTreeItem[]> {
        if (!element) {
            const db = postgres.Database.getInstance()
            this.computerCodes = await db.queryComputerCodes()
            if (this.computerCodes) {
                return lodash.values(this.computerCodes).map((value) => { return new ComputerTreeItem(value.name, value.id, value.description) })
            } else {
                return []
            }
        }
        if (element instanceof ComputerTreeItem) {
            if (element.pk in this.computerCodes) {
                return this.computerCodes[element.pk].codes.map((value) => { return new NodeTreeItem(value.label, value.id, value.description, value.nodeType, 'terminal') })
            }
            return []
        }
        return []
    }
}
