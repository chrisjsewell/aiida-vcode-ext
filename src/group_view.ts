'use strict'
import * as vscode from 'vscode'
import * as lodash from 'lodash'

import * as postgres from './postgres'
import { GroupTreeItem, NodeTreeItem } from './tree_items'


export class GroupTreeProvider implements vscode.TreeDataProvider<GroupTreeItem> {

    // here we make the provider a singleton, so we can refer to it elsewhere
    private static instance: GroupTreeProvider
    static getInstance(): GroupTreeProvider {
        if (!GroupTreeProvider.instance) {
            GroupTreeProvider.instance = new GroupTreeProvider()
        }
        return GroupTreeProvider.instance
      }
    private constructor() {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    private _onDidChangeTreeData: vscode.EventEmitter<GroupTreeItem | undefined> = new vscode.EventEmitter<GroupTreeItem | undefined>()
    readonly onDidChangeTreeData: vscode.Event<GroupTreeItem | undefined>
    private groupNodes: {[key: number]: postgres.Group} = {}

    refresh() {
        this._onDidChangeTreeData.fire(undefined)
    }

    getTreeItem(element: GroupTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: GroupTreeItem | NodeTreeItem): Promise<GroupTreeItem[] | NodeTreeItem[]> {
        if (!element) {
            const db = postgres.Database.getInstance()
            this.groupNodes = await db.queryGroupNodes()
            if (this.groupNodes) {
                return lodash.values(this.groupNodes).map((value) => { return new GroupTreeItem(value.label, value.id, value.description, value.typeString) })
            } else {
                return []
            }
        }
        if (element instanceof GroupTreeItem) {
            if (element.pk in this.groupNodes) {
                return this.groupNodes[element.pk].nodes.map((value) => { return new NodeTreeItem(value.label, value.id, value.description, value.nodeType, 'file') })
            }
            return []
        }
        return []
    }
}

