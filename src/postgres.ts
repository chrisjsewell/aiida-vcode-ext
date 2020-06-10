import { Client, Configuration } from 'ts-postgres'
import * as lodash from 'lodash'

export interface Node {
    id: number,
    label: string,
    description: string,
    nodeType: string
}
export interface Computer {
    id: number,
    name: string,
    description: string,
    codes: Node[]
}
export interface Group {
    id: number,
    label: string,
    description: string,
    typeString: string,
    nodes: Node[]
}

export interface Setting {
    id: number,
    key: string,
    description: string,
    value: any
}

/**
 * Add timeout for DB connection,
 * see: https://spin.atomicobject.com/2020/01/16/timeout-promises-nodejs/
*/
const promiseWithTimeout = (timeoutMs: number, client: Client) => {
    return Promise.race([
        client.connect(),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
}

export class Database {

    public config: Configuration = {}
    public timeoutMs: number = 1000
    public queryMaxRecords: number = 10000

    // here we make the database a singleton, so we can refer to it elsewhere
    private static instance: Database
    static getInstance(config: object | undefined = undefined, timeoutMs: number | undefined = undefined): Database {
        if (!Database.instance) {
            Database.instance = new Database(config, timeoutMs)
        }
        return Database.instance
    }

    private constructor(config: Configuration | undefined = undefined, timeoutMs: number | undefined = undefined) {
        if (config !== undefined) {
            this.config = config
        }
        if (timeoutMs !== undefined) {
            this.timeoutMs = timeoutMs
        }
    }

    /* wrapper for connecting to the client then running a query */
    private async runQuery(action: (client: Client) => Promise<any>): Promise<any> {
        const client = new Client(this.config)
        try {
            await promiseWithTimeout(this.timeoutMs, client)
        } catch (error) {
            return null
        }
        let output: any[]
        try {
            output = await action(client)
        } finally {
            await client.end()
        }
        return output
    }

    async queryComputer(pk: number): Promise<object> {
        return await this.runQuery(async (client) => {
            const resultIterator = client.query(
                'SELECT * from db_dbcomputer where db_dbcomputer.id=$1', [pk]
            )
            const row = await resultIterator.one()
            return lodash.zipObject(row.names, row.data)
        })
    }

    async queryComputerAuth(pk: number): Promise<object> {
        return await this.runQuery(async (client) => {
            const resultIterator = client.query(
                'SELECT * from db_dbauthinfo as a where a.dbcomputer_id=$1', [pk]
            )
            const row = await resultIterator.one()
            return lodash.zipObject(row.names, row.data)
        })
    }

    async queryNode(pk: number): Promise<object> {
        return await this.runQuery(async (client) => {
            const resultIterator = client.query(
                'SELECT * from db_dbnode where db_dbnode.id=$1', [pk]
            )
            const row = await resultIterator.one()
            return lodash.zipObject(row.names, row.data)
        })
    }

    async queryGroup(pk: number): Promise<object> {
        return await this.runQuery(async (client) => {
            const resultIterator = client.query(
                'SELECT * from db_dbgroup where db_dbgroup.id=$1', [pk]
            )
            const row = await resultIterator.one()
            return lodash.zipObject(row.names, row.data)
        })
    }

    async querySettings(): Promise<Setting[]> {
        return await this.runQuery(async (client) => {
            const resultIterator = client.query(
                'SELECT * from db_dbsetting'
            )
            const settings: Setting[] = []
            for await (const row of resultIterator) {
                settings.push({
                    id: row.get('id') as number,
                    key: row.get('key') as string,
                    description: row.get('description') as string,
                    value: row.get('val')
                })
            }
            return settings
        })
    }

    async queryComputerCodes(maxRecords: number | null = null): Promise<{ [key: number]: Computer }> {
        return await this.runQuery(async (client) => {
            const computers: { [key: number]: Computer } = {}
            const resultIterator = client.query(
                'SELECT c.id, c.name, c.description, n.id, n.label, n.description, n.node_type from db_dbcomputer as c ' +
                'LEFT JOIN db_dbnode as n ON c.id = n.dbcomputer_id ' +
                "WHERE n.node_type='data.code.Code.' ORDER BY c.id LIMIT $1", [maxRecords ? maxRecords : this.queryMaxRecords]
            )
            for await (const row of resultIterator) {
                const id = row.data[0] as number
                if (!(id in computers)) {
                    computers[id] = {
                        id: row.data[0] as number,
                        name: row.data[1] as string,
                        description: row.data[2] as string,
                        codes: []
                    }
                }
                computers[id].codes.push({
                    id: row.data[3] as number,
                    label: row.data[4] as string,
                    description: row.data[5] as string,
                    nodeType: row.data[6] as string
                })
            }
            return computers
        })
    }

    async queryGroupNodes(maxRecords: number | null = null): Promise<{ [key: number]: Group }> {
        return await this.runQuery(async (client) => {
            const groups: { [key: number]: Group } = {}
            const resultIterator = client.query(
                'SELECT g.id, g.label, g.description, g.type_string, n.id, n.label, n.description, n.node_type from db_dbgroup_dbnodes as gn ' +
                'LEFT JOIN db_dbgroup as g ON g.id = gn.dbgroup_id ' +
                'LEFT JOIN db_dbnode as n ON n.id = gn.dbnode_id ' +
                'ORDER BY g.type_string, g.id LIMIT $1', [maxRecords ? maxRecords : this.queryMaxRecords]
            )
            for await (const row of resultIterator) {
                const id = row.data[0] as number
                if (!(id in groups)) {
                    groups[id] = {
                        id: row.data[0] as number,
                        label: row.data[1] as string,
                        description: row.data[2] as string,
                        typeString: row.data[3] as string,
                        nodes: []
                    }
                }
                groups[id].nodes.push({
                    id: row.data[4] as number,
                    label: row.data[5] as string,
                    description: row.data[6] as string,
                    nodeType: row.data[7] as string
                })
            }
            return groups
        })
    }

}

