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
            const dbSettings = new vscode.TreeItem('DB Settings', vscode.TreeItemCollapsibleState.Collapsed)
            dbSettings.iconPath = iconPath('database')
            const refreshAll = new vscode.TreeItem('Refresh All', vscode.TreeItemCollapsibleState.None)
            refreshAll.iconPath = iconPath('refresh')
            refreshAll.command = {command: 'aiida.refreshAll', title: 'Refresh All'}
            const openHome = new vscode.TreeItem('AiiDA Home', vscode.TreeItemCollapsibleState.None)
            openHome.iconPath = iconPath('home')
            openHome.command = {command: 'aiida.openInBrowser', title: 'AiiDA Home', tooltip: 'Open aiida.net', arguments: [vscode.Uri.parse('http://www.aiida.net/')]}
            const openSettings = new vscode.TreeItem('Open Settings', vscode.TreeItemCollapsibleState.None)
            openSettings.iconPath = iconPath('settings')
            openSettings.command = {command: 'workbench.action.openSettings', title: 'AiiDA Settings', arguments: ['aiida']}
            return [
                refreshAll,
                openSettings,
                openHome,
                dbSettings
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
