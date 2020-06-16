'use strict'

import * as subprocess from 'child_process'
import { promisify } from 'util'

const execCommand = promisify(subprocess.exec)


export interface VerdiConfig {
    command: string | null,
    timeoutMs: number,
    profile?: string,
    path?: string | null
}

export class Verdi {

    // here we make the database a singleton, so we can refer to it elsewhere
    private static instance: Verdi
    static getInstance(config: VerdiConfig): Verdi {
        if (!Verdi.instance) {
            Verdi.instance = new Verdi(config)
        }
        return Verdi.instance
    }

    public readonly env: any

    private constructor(public readonly config: VerdiConfig) {
        if (!this.config.command) {
            this.config.command = 'verdi'
        }
        if (this.config.profile) {
            this.config.command = this.config.command + ' -p "' + this.config.profile + '"'
        }
        this.config.command = this.config.command + ' '
        this.env = this.config.path ? { AIIDA_PATH: this.config.path } : {}
    }

    async exec(args: string) {
        return await execCommand(this.config.command + args, {
            timeout: this.config.timeoutMs,
            env: this.env,
        })
    }

    async nodeFiles(pk: number): Promise<string[]> {
        const result = await this.exec(`node repo ls ${pk}`)
        return result.stdout.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    }

}
