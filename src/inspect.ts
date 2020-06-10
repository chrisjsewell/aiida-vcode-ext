import * as yaml from 'js-yaml'

import * as items from './tree_items'
import { Database } from './postgres'
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


export async function inspectGroup(item: items.GroupTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryGroup(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `group-${item.pk}`, fullId: `aiida-group-${item.pk}`}, content, '.yaml')
    }
}
