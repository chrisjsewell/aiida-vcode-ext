'use strict'
import * as vscode from 'vscode'
import * as path from 'path'
import * as lodash from 'lodash'

import * as postgres from './postgres'


export class ComputerTreeProvider implements vscode.TreeDataProvider<ComputerTreeItem> {

    // here we make the provider a singleton, so we can refer to it elsewhere
    private static instance: ComputerTreeProvider
    static getInstance(config: object | undefined = undefined, connectionTimeout: number | undefined = undefined): ComputerTreeProvider {
        if (!ComputerTreeProvider.instance) {
            ComputerTreeProvider.instance = new ComputerTreeProvider(config, connectionTimeout)
        }
        return ComputerTreeProvider.instance
      }
    private constructor(public config: object | undefined = undefined, public connectionTimeout: number | undefined = undefined) {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ComputerTreeItem | undefined> = new vscode.EventEmitter<ComputerTreeItem | undefined>()
    readonly onDidChangeTreeData: vscode.Event<ComputerTreeItem | undefined>
    private computerCodes: {[key: number]: postgres.Computer} = {}

    refresh() {
        this._onDidChangeTreeData.fire(undefined)
    }

    getTreeItem(element: ComputerTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: ComputerTreeItem | NodeTreeItem): Promise<ComputerTreeItem[] | NodeTreeItem[]> {
        if (!element) {
            const db = new postgres.Postgres(this.config, this.connectionTimeout)
            this.computerCodes = await db.queryComputerCodes()
            if (this.computerCodes) {
                return lodash.values(this.computerCodes).map((value) => { return new ComputerTreeItem(value.name, value.id, value.description) })
            } else {
                return []
            }
        }
        if (element instanceof ComputerTreeItem) {
            if (element.pk in this.computerCodes) {
                return this.computerCodes[element.pk].codes.map((value) => { return new NodeTreeItem(value.label, value.id, value.description, 'terminal') })
            }
            return []
        }
        return []
    }
}

export class ComputerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
    ) {
        super(label, collapsibleState)
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'computer.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'computer.svg')
        }
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        return `PK: ${this.pk}`
    }

    get contextValue(): string {
        return 'computer'
    }

}


export class NodeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly icon: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState)
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', `${icon}.svg`),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', `${icon}.svg`)
        }
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        return `PK: ${this.pk}`
    }

    get contextValue(): string {
        return 'node'
    }
}
