'use strict'

import * as subprocess from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { promisify } from 'util'

import * as vscode from 'vscode'

const execCommand = promisify(subprocess.exec)

function expanduser(filePath: string): string {
    if (filePath.charCodeAt(0) === 126 /* ~ */) {
        const home = os.homedir()
        filePath = home ? path.join(home, filePath.slice(1)) : filePath
    }
    return filePath
}


function validatePath(aiidaPath: string) {
    const configPath = path.normalize(path.join(expanduser(aiidaPath), 'config.json'))
    if (!fs.existsSync(configPath)) {
        return `The config file does not exist: ${configPath}`
    }
    return null
}

// function runCommand()

export async function setProfile() {

    const aiidaConfigDb = vscode.workspace.getConfiguration('aiida.database')
    const aiidaConfigVerdi = vscode.workspace.getConfiguration('aiida.verdi')

    // Select connection type
    const connectType: undefined | 'local' | 'docker' = await vscode.window.showQuickPick(['local', 'docker'], { canPickMany: false, placeHolder: 'Select connection type' }) as undefined | 'local' | 'docker'
    if (!connectType) {
        return
    }

    // get aiida path
    let aiidaPath: string | null | undefined = null
    // if the connection is via docker, we assume the default AIIDA Path
    if (connectType === 'local') {
        let currentAiidaPath = aiidaConfigVerdi.get('path') as string
        if (!currentAiidaPath) {
            currentAiidaPath = '~/.aiida'
        }
        aiidaPath = await vscode.window.showInputBox({
            value: expanduser(currentAiidaPath),
            prompt: 'Enter the AiiDA Path',
            validateInput: validatePath
        })
        if (!aiidaPath) {
            return
        }
        aiidaPath = path.normalize(expanduser(aiidaPath))
    }

    // choose timeout
    // TODO currently timeout same for postgres queries and verdi commands
    let currentTimeout = aiidaConfigDb.get('timeout_ms')
    if (!currentTimeout) {
        currentTimeout = 2000
    }
    const timeoutString = await vscode.window.showInputBox({
        value: `${currentTimeout}`,
        prompt: 'Enter timeout (ms) for executing commands and queries',
        validateInput: (input: string) => { const int = parseInt(input); if (isNaN(int)) { return 'Input is not an integer' } return null },
    })
    if (!timeoutString) {
        return
    }
    const timeout = parseInt(timeoutString)

    // get verdi executable command
    let verdiCommand: string | undefined = aiidaConfigVerdi.get('command')
    if (!verdiCommand) {
        if (connectType === 'local') {
            const pythonPath = vscode.workspace.getConfiguration('python').get('pythonPath') as string
            if (pythonPath && path.dirname(pythonPath)) {
                console.log(pythonPath)
                verdiCommand = path.join(path.dirname(pythonPath), 'verdi')
            } else {
                verdiCommand = '/usr/bin/verdi'
            }
        }
        if (connectType === 'docker') {
            verdiCommand = 'docker exec --user aiida aiida-core verdi'
        }
    }
    function validateCommand(command: string) {
        command = command + ' profile list'
        try {
            subprocess.execSync(command, {
                timeout,
                env: { AIIDA_PATH: aiidaPath },
            })
        } catch (err) {
            // console.log(err)
            return `Non-zero exit code returned for '${command}'`
        }
        return null
    }
    verdiCommand = await vscode.window.showInputBox({
        value: verdiCommand,
        prompt: 'Enter the verdi executable',
        validateInput: validateCommand,
    })
    if (!verdiCommand) {
        return
    }

    // choose profile

    // $ verdi profile list
    // Info: configuration folder: /Users/cjs14/.aiida
    // * default
    //   quicksetup

    const output = await execCommand(verdiCommand + '  profile list', {
        timeout,
        env: { AIIDA_PATH: aiidaPath },
    })
    const profiles = output.stdout.split('\n').filter(
        line => line.trim().length > 0 && (!line.startsWith('Info:'))).map((name => {
            if (name.startsWith('*')) {
                name = name.substr(1)
            }
            return name.trim()
        }))
    if (profiles.length === 0) {
        vscode.window.showErrorMessage('No AiiDA profiles set')
        return
    }
    let profile: string | undefined = profiles[0]
    if (profiles.length > 1) {
        profile = await vscode.window.showQuickPick(profiles, { canPickMany: false, placeHolder: 'Select profile' })
    }
    if (profile === undefined) {
        return
    }

    // get connection details
    const outputConnect = await execCommand(verdiCommand + `  profile show ${profile}`, {
        timeout,
        env: { AIIDA_PATH: aiidaPath },
    })
    const connectDetails = outputConnect.stdout.split('\n').filter(
        line => line.trim().startsWith('aiidadb_')).map(
            line => {
                const fields = line.trim().split(/(\s+)/, 3)
                return { key: fields[0], value: fields[2] }
            }).reduce(
                (obj, item) => {
                    obj[item.key] = item.value
                    return obj
                },
                {} as { [index: string]: string })

    const vsConfig = {
        'host': connectDetails['aiidadb_host'],
        'port': parseInt(connectDetails['aiidadb_port']),
        'user': connectDetails['aiidadb_user'],
        'database': connectDetails['aiidadb_name'],
        'password': connectDetails['aiidadb_pass'],
        'timeout_ms': timeout
    }

    // TODO currently assume that postgres is exposed on the same port to localhost
    if (connectType === 'docker') {
        vsConfig['host'] = 'localhost'
    }

    // save configuration to settings
    await vscode.workspace.getConfiguration('aiida').update('database', vsConfig)
    await vscode.workspace.getConfiguration('aiida').update('verdi', {
        'command': verdiCommand,
        'path': aiidaPath, profile,
        'timeout_ms': timeout,
        'max_buffer_kb': 1024
    })
    vscode.window.showInformationMessage(`Added configuration settings for profile: ${profile}`)
}
