'use strict'
import * as vscode from 'vscode'
import * as lodash from 'lodash'

import * as postgres from './postgres'
import { AiidaTreeItem, ProcessTreeItem } from './tree_items'


export class ProcessTreeProvider implements vscode.TreeDataProvider<AiidaTreeItem> {

    // here we make the provider a singleton, so we can refer to it elsewhere
    private static instance: ProcessTreeProvider
    static getInstance(): ProcessTreeProvider {
        if (!ProcessTreeProvider.instance) {
            ProcessTreeProvider.instance = new ProcessTreeProvider()
        }
        return ProcessTreeProvider.instance
    }
    private constructor() {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    private _onDidChangeTreeData: vscode.EventEmitter<AiidaTreeItem | undefined> = new vscode.EventEmitter<AiidaTreeItem | undefined>()
    readonly onDidChangeTreeData: vscode.Event<AiidaTreeItem | undefined>
    private processes: postgres.Process[] = []
    private groupBy: (null | 'icon' | 'process')[] = [null, 'icon', 'process']
    private groupByIndex: number = 0

    toggleGroupBy() {
        this.groupByIndex += 1
        if (this.groupByIndex >= this.groupBy.length) {
            this.groupByIndex = 0
        }
        this.refresh()
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined)
    }

    getTreeItem(element: AiidaTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: AiidaTreeItem | ProcessTreeItem): Promise<AiidaTreeItem[] | ProcessTreeItem[]> {
        if (!element) {
            const db = postgres.Database.getInstance()
            this.processes = await db.queryProcesses()

            if (!this.processes) {return []}

            if (!this.groupBy[this.groupByIndex]) {
                return this.processes.map((value) => { return new ProcessTreeItem(value) })
            }

            if (this.groupBy[this.groupByIndex] === 'icon') {
                const topLevel: AiidaTreeItem[] = []
                for (const {icon} of lodash.uniqBy(lodash.values(this.processes), 'icon')) {
                    const groupTypeItem = new AiidaTreeItem(icon.replace('status', ''), icon, vscode.TreeItemCollapsibleState.Expanded)
                    topLevel.push(groupTypeItem)
                }
                return topLevel
            }

            if (this.groupBy[this.groupByIndex] === 'process') {
                const topLevel: AiidaTreeItem[] = []
                for (const {processType} of lodash.uniqBy(lodash.values(this.processes), 'processType')) {
                    const groupTypeItem = new AiidaTreeItem(processType, undefined, vscode.TreeItemCollapsibleState.Expanded)
                    topLevel.push(groupTypeItem)
                }
                return topLevel
            }
        } else {
            if (this.groupBy[this.groupByIndex] === 'icon') {
                return []
            }
            if (this.groupBy[this.groupByIndex] === 'process') {
                return []
            }
        }
        return []
    }
}
