'use strict'

import test from 'ava'

import { Verdi } from '../verdi'


test.beforeEach(t => {
	t.context = Verdi.getInstance({
        command: 'docker exec --user aiida aiida-core verdi',
        profile: 'default',
        timeoutMs: 2000
    })
})

test('basic execution', async t => {
    const verdi = t.context as Verdi
    const value = await verdi.exec('--version')
    t.is(value.stdout.trim(), 'AiiDA version 1.2.1')
})

test('failed execution', async t => {
    const verdi = t.context as Verdi
    let exitCode = 0
    try {
        await verdi.exec('--other')
    } catch (error) {
        exitCode = error.code
    }
    t.is(exitCode, 2)
})

test('nodeFiles', async t => {
    const verdi = t.context as Verdi
    const value = await verdi.nodeFiles(109)
    t.deepEqual(value.sort(), ['.aiida', '_aiidasubmit.sh', 'aiida.in'])
})

test.todo('readFile')
test.todo('readFile, exceeding buffer')
