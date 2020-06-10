import { Client, Configuration } from 'ts-postgres'

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

export class Postgres {

    public config: Configuration = {}
    public timeoutMs: number = 1000

    constructor(config: Configuration | undefined = undefined, timeoutMs: number | undefined = undefined) {
        if (config !== undefined) {
            this.config = config
        }
        if (timeoutMs !== undefined) {
            this.timeoutMs = timeoutMs
        }
        // console.log(this.config)
        // console.log(this.timeoutMs)
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

    async queryComputers(): Promise<Computer[] | null> {
        return await this.runQuery(async (client) => {
            const computers: Computer[] = []
            const resultIterator = client.query(
                'SELECT id, name, description from db_dbcomputer LIMIT 1000'
            )
            for await (const row of resultIterator) {
                computers.push({
                    id: row.get('id') as number,
                    name: row.get('name') as string,
                    description: row.get('description') as string,
                    codes: []
                })
            }
            return computers
        })
    }

    async queryComputerCodes(): Promise<{[key: number]: Computer} > {
        return await this.runQuery(async (client) => {
            const computers: {[key: number]: Computer} = {}
            const resultIterator = client.query(
                'SELECT c.id, c.name, c.description, n.id, n.label, n.description, n.node_type from db_dbcomputer as c ' +
                'LEFT JOIN db_dbnode as n ON c.id = n.dbcomputer_id ' +
                "WHERE n.node_type='data.code.Code.' ORDER BY c.id LIMIT 1000"
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
}

