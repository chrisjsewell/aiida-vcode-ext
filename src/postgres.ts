// Based on aiida-core database schema 1.0.44
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

export interface Process {
    id: number,
    label: string | null,
    description: string | null,
    mtime: string,
    nodeType: string,
    processType: string,
    processLabel: string,
    processState: 'created' | 'running' | 'waiting' | 'finished' | 'excepted' | 'killed' | null,
    processStatus: string | null,
    exitStatus: number | null,
    schedulerState: string | null,
    paused: boolean | null,
    icon: 'statusSucceeded' | 'statusKilled' | 'statusFailed' | 'statusCreated' | 'statusPaused' | 'statusUnknown' | 'statusWaiting' | 'statusRunning' | 'statusExcepted'
}

const stateToIcon: { [key: string]: 'statusSucceeded' | 'statusKilled' | 'statusFailed' | 'statusCreated' | 'statusPaused' | 'statusUnknown' | 'statusWaiting' | 'statusRunning' | 'statusExcepted' } = { 'created': 'statusCreated', 'running': 'statusRunning', 'waiting': 'statusWaiting', 'finished': 'statusFailed', 'excepted': 'statusExcepted', 'killed': 'statusKilled' }


export interface NodeLink {
    linkDirection: 'incoming' | 'outgoing',
    linkLabel: string,
    linkType: string,
    nodeId: number,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string
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
const connectWithTimeout = (timeoutMs: number, client: Client) => {
    return Promise.race([
        client.connect(),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('AiiDA DB connection timeout')), timeoutMs)),
    ])
}

export class Database {

    public config: Configuration = {}
    public timeoutMs: number = 2000
    public queryMaxRecords: number = 10000

    // number of row operations carried out on database
    private rowOpCount: number = 0

    // here we make the database a singleton, so we can refer to it elsewhere
    private static instance: Database
    static getInstance(config: Configuration | undefined = undefined, timeoutMs: number | undefined = undefined): Database {
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
            await connectWithTimeout(this.timeoutMs, client)
        } catch (error) {
            return null
        }
        let output: any[]
        try {
            output = await Promise.race([
                action(client),
                new Promise((resolve, reject) => setTimeout(() => reject(new Error('AiiDA DB query timeout')), this.timeoutMs)),
            ])
        } finally {
            try {
                await client.end()
            } catch (error) {}
        }

        // TODO how best to catch errors and inform user of e.g. timeout?

        return output
    }

    async testConnection(): Promise<string | null> {
        return await this.runQuery(async (client) => {
            const row = await client.query('SELECT CURRENT_USER as user').one()
            return row.get('user')
        })
    }

    async hasChanged(): Promise<any> {
        return await this.runQuery(async (client) => {
            const row = await client.query(
                'select tup_inserted, tup_updated, tup_deleted from pg_stat_database'
            ).one()
            const values = row.data.map(v => {return v ? parseInt(v.toString()): 0})
            const sum = values[0] + values[1] + values[2]
            if (sum > this.rowOpCount) {
                this.rowOpCount = sum
                return true
            }
            return false
        })
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
                'ORDER BY g.type_string, g.id LIMIT $1',
                [maxRecords ? maxRecords : this.queryMaxRecords]
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

    async queryNodeLogs(pk: number): Promise<object[]> {
        return await this.runQuery(async (client) => {
            const results = await client.query(
                'SELECT * from db_dblog as l WHERE l.dbnode_id=$1 ORDER BY l.time DESC', [pk]
            )
            const output = results.rows.map(row => (lodash.zipObject(results.names, row) as unknown as NodeLink))
            return output
        })
    }

    async queryNodeIncoming(pk: number): Promise<NodeLink[]> {
        return await this.runQuery(async (client) => {
            const results = await client.query(
                "SELECT 'incoming', l.label, l.type, n.id, n.label, n.description, n.node_type from db_dblink as l " +
                'LEFT JOIN db_dbnode as n ON n.id = l.input_id ' +
                'WHERE l.output_id=$1 ORDER BY n.mtime DESC LIMIT $2',
                [pk, this.queryMaxRecords]
            )
            const names = ['linkDirection', 'linkLabel', 'linkType', 'nodeId', 'nodeLabel', 'nodeDescription', 'nodeType']
            const output = results.rows.map(row => (lodash.zipObject(names, row)))
            return output
        })
    }

    async queryNodeOutgoing(pk: number): Promise<NodeLink[]> {
        return await this.runQuery(async (client) => {
            const results = await client.query(
                "SELECT 'outgoing', l.label, l.type, n.id, n.label, n.description, n.node_type from db_dblink as l " +
                'LEFT JOIN db_dbnode as n ON n.id = l.output_id ' +
                'WHERE l.input_id=$1 ORDER BY n.mtime DESC LIMIT $2',
                [pk, this.queryMaxRecords]
            )
            const names = ['linkDirection', 'linkLabel', 'linkType', 'nodeId', 'nodeLabel', 'nodeDescription', 'nodeType']
            const output = results.rows.map(row => (lodash.zipObject(names, row) as unknown as NodeLink))
            return output
        })
    }

    async queryProcesses(maxRecords: number | null = null): Promise<Process[]> {
        return await this.runQuery(async (client) => {
            const results = await client.query(
                'SELECT n.id, n.label, n.description, n.mtime, n.node_type, n.process_type, ' +
                "n.attributes -> 'process_state', n.attributes -> 'process_status', n.attributes -> 'process_label', " +
                "n.attributes -> 'exit_status', n.attributes -> 'scheduler_state', n.attributes -> 'paused', 'statusUnknown'" +
                'from db_dbnode as n where n.process_type is not null ' +
                'ORDER BY n.mtime DESC LIMIT $1',
                [maxRecords ? maxRecords : this.queryMaxRecords]
            )
            const names = ['id', 'label', 'description', 'mtime', 'nodeType', 'processType',
                'processState', 'processStatus', 'processLabel', 'exitStatus', 'schedulerState', 'paused', 'icon']
            const output = results.rows.map(row => (lodash.zipObject(names, row) as unknown as Process))

            // set icon
            for (const item of output) {
                if (item.processState) {
                    item.icon = lodash.get(stateToIcon, item.processState, 'statusUnknown')
                }
                if (item.paused === true) {
                    item.icon = 'statusPaused'
                }
                if (item.exitStatus === 0 && item.processState === 'finished') {
                    item.icon = 'statusSucceeded'
                }
            }
            return output
        })
    }

}
