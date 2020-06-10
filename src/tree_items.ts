'use strict'
import * as vscode from 'vscode'
import * as path from 'path'


export function iconPath(iconName: string) {
    return {
        light: path.join(__filename, '..', '..', 'resources', 'light', `${iconName}.svg`),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', `${iconName}.svg`)
    }
}

const nodeIconMatches: { type: string, iconName: string }[] = [
    { type: 'data.code', iconName: 'terminal' },
    { type: 'data.dict', iconName: 'list-unordered' },
    { type: 'process', iconName: 'rocket' },
    { type: 'data', iconName: 'file' }
]

export class AiidaTreeItem extends vscode.TreeItem {
    public readonly pk: number = 0
    public readonly descript: string = ''
    public readonly typeString: string = ''

    constructor(
        public readonly label: string,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState)
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        return ''
    }

    get contextValue(): string {
        return ''
    }
}


export class ComputerTreeItem extends AiidaTreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
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


export class GroupTreeItem extends AiidaTreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly typeString: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(label, collapsibleState)
        this.iconPath = this.iconPath = iconPath('sub-folder')
    }

    get tooltip(): string {
        return `${this.descript}`
    }

    get description(): string {
        // return `PK: ${this.pk}, Type: ${this.typeString}`
        return `PK: ${this.pk}`
    }

    get contextValue(): string {
        return 'group'
    }

}


export class NodeTreeItem extends AiidaTreeItem {
    constructor(
        public readonly label: string,
        public readonly pk: number,
        public readonly descript: string,
        public readonly typeString: string,
        public readonly icon: string | null = null,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState)
        if (!icon) {
            icon = 'file'
            for (const { type, iconName } of nodeIconMatches) {
                if (typeString.startsWith(type)) {
                    icon = iconName
                    break
                }
            }
        }
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
