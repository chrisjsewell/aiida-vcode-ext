'use strict'
import * as vscode from 'vscode'
import * as path from 'path'
import * as yaml from 'js-yaml'

import {Process} from './postgres'


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

    constructor(
        public readonly label: string,
        icon?: string,
        collapsibleState?: vscode.TreeItemCollapsibleState,
        public readonly typeString: string = ''
    ) {
        super(label, collapsibleState)
        if (!icon) {
            icon = 'file'
            for (const { type, iconName } of nodeIconMatches) {
                if (this.typeString.startsWith(type)) {
                    icon = iconName
                    break
                }
            }
        }
        this.iconPath = iconPath(icon)
    }

    get description(): string {
        return ''
    }

    get tooltip(): string {
        if (this.descript){
            return `${this.descript}`
        }
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
        super(label, 'computer', collapsibleState)
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
        super(label, 'sub-folder', collapsibleState)
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
        public readonly icon?: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, icon, collapsibleState, typeString)
    }

    get description(): string {
        return `PK: ${this.pk}, Type: ${this.typeString}`
    }

    get contextValue(): string {
        return 'node'
    }
}


export class ProcessTreeItem extends AiidaTreeItem {
    constructor(
        public readonly data: Process,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(data.processLabel, data.icon, collapsibleState)
    }

    get description(): string {
        return `PK: ${this.data.id}, Type: ${this.data.processType}`
    }

    get tooltip(): string {
        return yaml.safeDump(this.data)
    }

    get contextValue(): string {
        return 'process'
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
