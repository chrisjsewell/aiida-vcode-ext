import * as yaml from 'js-yaml'
import * as path from 'path'
import * as vscode from 'vscode'

import * as items from './tree_items'
import { Database } from './postgres'
import { Verdi } from './verdi'
import { contentProvider } from './extension'

export async function inspectComputer(item: items.ComputerTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryComputer(item.pk)
    const auth = await db.queryComputerAuth(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump({settings: data, config: auth})

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `computer-${item.pk}`, fullId: `aiida-computer-${item.pk}`}, content, '.yaml')
    }
}


export async function inspectNode(item: items.NodeTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryNode(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `node-${item.pk}`, fullId: `aiida-node-${item.pk}`}, content, '.yaml')
    }
}


export async function inspectProcess(item: items.ProcessTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryNode(item.data.id)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `process-${item.data.id}`, fullId: `aiida-process-${item.data.id}`}, content, '.yaml')
    }
}


export async function inspectProcessLogs(item: items.ProcessTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryNodeLogs(item.data.id)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `logs-${item.data.id}`, fullId: `aiida-logs-${item.data.id}`}, content, '.yaml')
    }
}


export async function inspectGroup(item: items.GroupTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryGroup(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `group-${item.pk}`, fullId: `aiida-group-${item.pk}`}, content, '.yaml')
    }
}

export async function inspectFile(item: items.FileTreeItem) {
    const verdi = Verdi.getInstance()
    const result = await verdi.readFile(item.pk, item.label)
    if (result.error) {
        vscode.window.showWarningMessage(`${item.label} truncated: ${result.error.message} (code ${result.error.code})`)
    }
    let ext = path.extname(item.label)
    if (ext === ''){
        ext = '.txt'
    }
    if (contentProvider) {
        await contentProvider.openReadOnlyContent({
            label: `node-${item.pk}-${path.basename(item.label, ext)}`,
            fullId: `aiida-file-${item.pk}-${item.label}`},
            // TODO what if binary file (will probably fail in verdi)
            result.content.toString(), ext)
    }
}
