import * as yaml from 'js-yaml'

import { ComputerTreeItem } from './computer_view'
import { Database } from './postgres'
import { contentProvider } from './extension'

export async function inspectComputer(item: ComputerTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryComputer(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `computer-${item.pk}`, fullId: `aiida-computer-${item.pk}`}, content, '.yaml')
    }
}


export async function inspectNode(item: ComputerTreeItem) {
    const db = Database.getInstance()
    const data = await db.queryNode(item.pk)
    // const content: string = JSON.stringify(data, undefined, '  ')
    const content: string = yaml.safeDump(data)

    if (contentProvider) {
        await contentProvider.openReadOnlyContent({label: `node-${item.pk}`, fullId: `aiida-node-${item.pk}`}, content, '.yaml')
    }
}
