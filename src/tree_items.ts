'use strict'
import * as vscode from 'vscode'
import * as path from 'path'


export function iconPath(iconName: string) {
    return {
        light: path.join(__filename, '..', '..', 'resources', 'light', `${iconName}.svg`),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', `${iconName}.svg`)
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
        this.iconPath = iconPath('computer')
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
        this.iconPath = this.iconPath = iconPath('folder')
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
        this.iconPath = iconPath(icon)
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


export class SettingTreeItem extends vscode.TreeItem {
    constructor(
        public readonly pk: number,
        public readonly key: string,
        public readonly value: any,
        public readonly descript: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(key, collapsibleState)
        this.iconPath = iconPath('key')
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        return `${this.value}`
    }

    get contextValue(): string {
        return 'setting'
    }
}
