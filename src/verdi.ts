'use strict'

import * as subprocess from 'child_process'


interface ExecError {
    message: string,
    name: string,
    stack?: string,
    code: number,
    signal: number
}

function execCommand(command: string, options: any): Promise<{stdout: Buffer, stderr: Buffer, error: ExecError | null}> {
    return new Promise((resolve, reject) => {
        subprocess.exec(command, options, (error, stdout, stderr) => {
            let newError: ExecError | null = null
            if (error){
                newError = error as ExecError
            }
            resolve({stdout, stderr, error: newError})
        })
    })
}

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

    async exec(args: string): Promise<{stdout: Buffer, stderr: Buffer, error: ExecError | null}> {
        return await execCommand(this.config.command + args, {
            timeout: this.config.timeoutMs,
            env: this.env,
            maxBuffer: this.maxBufferBytes
        })
    }

    async nodeFiles(pk: number): Promise<{files: string[], error: ExecError | null}> {
        // TODO #2 how to discriminate files and folders
        let result
        result = await this.exec(`node repo ls ${pk}`)
        // TODO deal with this better in VSCode
        if (result.error) {
            // we try twice, in case of intermittent failure, since its a relatively cheap command
            result = await this.exec(`node repo ls ${pk}`)
        }
        if (result.error) {
            console.log(result.error)
        }
        return {
            files: result.stdout.toString().split('\n').map(line => line.trim()).filter(line => line.length > 0),
            error: result.error
        }
    }

    async readFile(pk: number, path: string): Promise<{content: Buffer, error: ExecError | null}> {
        const result = await this.exec(`node repo cat ${pk} ${path}`)
        return {
            content: result.stdout,
            error: result.error
        }
    }

}
