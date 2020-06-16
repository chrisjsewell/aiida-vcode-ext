'use strict'
import * as vscode from 'vscode'
import * as lodash from 'lodash'

import * as postgres from './postgres'
import { Verdi } from './verdi'
import { AiidaTreeItem, ProcessTreeItem, NodeTreeItem, FileTreeItem } from './tree_items'


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

        // Top level
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
                    const groupTypeItem = new AiidaTreeItem(icon.replace('status', ''), icon, vscode.TreeItemCollapsibleState.Collapsed)
                    groupTypeItem.levelName = 'top'
                    topLevel.push(groupTypeItem)
                }
                return topLevel
            }

            if (this.groupBy[this.groupByIndex] === 'process') {
                const topLevel: AiidaTreeItem[] = []
                for (const {processType} of lodash.uniqBy(lodash.values(this.processes), 'processType')) {
                    const groupTypeItem = new AiidaTreeItem(processType, undefined, vscode.TreeItemCollapsibleState.Collapsed)
                    groupTypeItem.levelName = 'top'
                    topLevel.push(groupTypeItem)
                }
                return topLevel
            }

            return []
        }

        if (element.levelName === 'top') {
            if (!this.processes) {return []}
            if (this.groupBy[this.groupByIndex] === 'icon') {
                return this.processes.filter(value => value.icon.replace('status', '') === element.label).map(value => new ProcessTreeItem(value))
            }
            if (this.groupBy[this.groupByIndex] === 'process') {
                return this.processes.filter(value => value.processType === element.label).map(value => new ProcessTreeItem(value))
            }
            return []
        }

        if (element instanceof ProcessTreeItem){
            const incomingItem = new AiidaTreeItem('Incoming', 'package-dependencies', vscode.TreeItemCollapsibleState.Collapsed, '', element.data.id)
            incomingItem.levelName = 'incoming'
            const outgoingItem = new AiidaTreeItem('Outgoing', 'package-dependents', vscode.TreeItemCollapsibleState.Expanded, '', element.data.id)
            outgoingItem.levelName = 'outgoing'
            return [incomingItem, outgoingItem]
        }

        if (element.levelName === 'incoming') {
            const db = postgres.Database.getInstance()
            const nodes = await db.queryNodeIncoming(element.pk)
            return nodes.map(value => new NodeTreeItem(value.linkLabel, value.nodeId, value.linkType, value.nodeType, undefined, vscode.TreeItemCollapsibleState.Collapsed))
        }

        if (element.levelName === 'outgoing') {
            const db = postgres.Database.getInstance()
            const nodes = await db.queryNodeOutgoing(element.pk)
            return nodes.map(value => new NodeTreeItem(value.linkLabel, value.nodeId, value.linkType, value.nodeType, undefined, vscode.TreeItemCollapsibleState.Collapsed))
        }

        if (element instanceof NodeTreeItem){
            const verdi = Verdi.getInstance()
            const files = await verdi.nodeFiles(element.pk)
            return files.map(value => new FileTreeItem(value, element.pk, ''))
        }

        return []
    }
}
