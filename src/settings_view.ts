'use strict'
import * as vscode from 'vscode'
import * as lodash from 'lodash'

import * as postgres from './postgres'
import { iconPath, SettingTreeItem } from './tree_items'


export class MiscTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    // here we make the provider a singleton, so we can refer to it elsewhere
    private static instance: MiscTreeProvider
    static getInstance(): MiscTreeProvider {
        if (!MiscTreeProvider.instance) {
            MiscTreeProvider.instance = new MiscTreeProvider()
        }
        return MiscTreeProvider.instance
      }
    private constructor() {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>()
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined>

    refresh() {
        this._onDidChangeTreeData.fire(undefined)
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {

        if (!element) {
            const settings = new vscode.TreeItem('DB Settings', vscode.TreeItemCollapsibleState.Collapsed)
            settings.iconPath = iconPath('settings')
            return [
                settings
            ]
        }
        if (element.label === 'DB Settings') {
            const db = postgres.Database.getInstance()
            const settingsList = await db.querySettings()
            if (settingsList) {
                return lodash.values(settingsList).map((value) => { return new SettingTreeItem(value.id, value.key, value.value, value.description) })
            } else {
                return []
            }
        }
        return []
    }
}
