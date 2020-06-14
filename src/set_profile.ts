'use strict'

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { promisify } from 'util'

import * as vscode from 'vscode'

const readFile = promisify(fs.readFile)


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

export async function setProfile() {
    const currentAiidaPath = vscode.workspace.getConfiguration('aiida').get('path') as string

    let aiidaPath = await vscode.window.showInputBox({
        value: expanduser(currentAiidaPath),
        prompt: 'Enter the AiiDA Path',
        validateInput: validatePath
    })
    if (!aiidaPath) {
        return
    }
    aiidaPath = path.normalize(expanduser(aiidaPath))
    const configPath = path.join(aiidaPath, 'config.json')
    let profiles: string[]
    let config: any
    try {
        const configString = await readFile(configPath, 'utf8')
        config = JSON.parse(configString)
        profiles = Object.keys(config['profiles'])
    } catch (error) {
        vscode.window.showErrorMessage('AiiDA configuration file could not be read')
        return
    }
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
    const data = config['profiles'][profile]

    const vsConfig = {
        profile,
        'host': data['AIIDADB_HOST'],
        'port': data['AIIDADB_PORT'],
        'user': data['AIIDADB_USER'],
        'database': data['AIIDADB_NAME'],
        'password': data['AIIDADB_PASS'],
        'timeout_ms': 2000
    }
    vscode.workspace.getConfiguration('aiida').update('connection', vsConfig)
    vscode.workspace.getConfiguration('aiida').update('path', aiidaPath)
    vscode.window.showInformationMessage(`Set connection settings for profile: ${profile}`)
}
