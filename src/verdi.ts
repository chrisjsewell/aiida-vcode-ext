'use strict'

import * as subprocess from 'child_process'
import { promisify } from 'util'

const execCommand = promisify(subprocess.exec)


export interface VerdiConfig {
    command?: string | null,
    timeoutMs?: number,
    profile?: string,
    path?: string | null,
    maxBufferKb?: number
}

export class Verdi {

    // here we make the database a singleton, so we can refer to it elsewhere
    private static instance: Verdi
    static getInstance(config?: VerdiConfig): Verdi {
        if (!Verdi.instance) {
            if (!config) {
                config = {}
            }
            Verdi.instance = new Verdi(config)
        }
        return Verdi.instance
    }

    private env: any
    private maxBufferBytes: undefined | number

    private constructor(public config: VerdiConfig) {
        this.update()
    }

    update() {
        if (!this.config.command) {
            this.config.command = 'verdi'
        }
        if (this.config.profile) {
            this.config.command = this.config.command + ' -p "' + this.config.profile + '"'
        }
        this.config.command = this.config.command + ' '
        this.env = this.config.path ? { AIIDA_PATH: this.config.path } : {}
        this.maxBufferBytes = this.config.maxBufferKb
        if (this.maxBufferBytes) {
            this.maxBufferBytes = 1024 * this.maxBufferBytes
        }
    }

    async exec(args: string) {
        return await execCommand(this.config.command + args, {
            timeout: this.config.timeoutMs,
            env: this.env,
            maxBuffer: this.maxBufferBytes
        })
    }

    async nodeFiles(pk: number): Promise<string[]> {
        // TODO #2 how to discriminate files and folders
        const result = await this.exec(`node repo ls ${pk}`)
        return result.stdout.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    }

    async readFile(pk: number, path: string): Promise<string> {
        const result = await this.exec(`node repo cat ${pk} ${path}`)
        return result.stdout
    }

}
