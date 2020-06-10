'use strict'
import * as vscode from 'vscode'
import * as path from 'path'

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


export class GroupTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly typeString: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(label, collapsibleState)
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
        }
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        return `PK: ${this.pk}, Type: ${this.typeString}`
    }

    get contextValue(): string {
        return 'group'
    }

}


export class NodeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly typeString: string,
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
        return `PK: ${this.pk}, Type: ${this.typeString}`
    }

    get contextValue(): string {
        return 'node'
    }
}
