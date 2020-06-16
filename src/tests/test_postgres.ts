'use strict'

import test from 'ava'

import { Database } from '../postgres'


test.beforeEach(t => {
	t.context = Database.getInstance(
        {
            host: 'localhost',
            port: 5432,
            user: 'aiida',
            password: 'password',
            database: 'aiida_db'
        },
        2000
    )
})

test('connection', async t => {
    const db = t.context as Database
    const value = await db.testConnection()
    t.is(value, 'aiida')
})


test.serial('bad connection', async t => {
    const db = t.context as Database
    db.config.host = 'unknown'
    let value = null
    try {
        value = await db.testConnection()
    } finally {
        db.config.host = 'localhost'
    }
    t.is(value, null)
})

test('queryComputer', async t => {
    const db = t.context as Database
    const value = await db.queryComputer(1)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    //@ts-ignore
    t.is(value.name, 'qe_computer')
})

test.todo('queryComputerAuth')
test.todo('queryNode')
test.todo('queryGroup')
test.todo('querySettings')
test.todo('queryComputerCodes')
test.todo('queryGroupNodes')
test.todo('queryNodeLogs')
test.todo('queryNodeIncoming')
test.todo('queryNodeOutgoing')
test.todo('queryProcesses')
