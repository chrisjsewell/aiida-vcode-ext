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
    const result = await verdi.exec('--version')
    t.is(result.error, null)
    t.is(result.stdout.toString().trim(), 'AiiDA version 1.2.1')
})

test('failed execution', async t => {
    const verdi = t.context as Verdi
    const result =await verdi.exec('--other')
    const err = result.error
    if (err === null) {
        t.fail('no error returned')
        return
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    //@ts-ignore
    t.is(err.code, 2)
})

test('nodeFiles', async t => {
    const verdi = t.context as Verdi
    const result = await verdi.nodeFiles(109)
    t.is(result.error, null)
    t.deepEqual(result.files.sort(), ['.aiida', '_aiidasubmit.sh', 'aiida.in'])
})

test.todo('readFile')
test.todo('readFile, exceeding buffer')
