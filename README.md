# AiiDA VSCode Extension [IN DEVELOPMENT]

[![VS Marketplace][vs-market-badge]][vs-market-link]
[![Github-CI][github-ci-badge]][github-ci-link]

A VSCode Extension for working with and exploring [AiiDA](http://www.aiida.net/) repositories.

<img width="500" alt="screenshot" src="https://raw.githubusercontent.com/chrisjsewell/aiida-vcode-ext/master/gifs/aiida-vscode-demo.gif">

## Setup

The extension requires at least a PostgreSQL client to be running locally (see [here for example](https://www.compose.com/articles/postgresql-tips-installing-the-postgresql-client/)), that can connect to a database running on an open port (usually 5432).
Then a connection can be configured directly in the settings or using the setup helper:

<img width="500" alt="screenshot" src="https://raw.githubusercontent.com/chrisjsewell/aiida-vcode-ext/master/gifs/aiida-vscode-setup.gif">

## Develoment

Testing is run against a [Docker compose](https://docs.docker.com/compose/) environment, with [Node.js](https://nodejs.org) version 12 and [ava](https://github.com/avajs/ava) as the test runner.
To run the tests, make sure you have [Docker](https://www.docker.com/) installed, then launch the containers:

```console
$ cd docker
$ docker-compose up -d
$ docker-compose ps
     Name                   Command              State           Ports
-------------------------------------------------------------------------------
aiida-core       /sbin/my_init                   Up
aiida-database   docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp
```

Linting and tests can then be run after installing the node packages:

```console
$ npm ci
$ npm run lint:fix
$ npm test
```

Note, when powering down the docker environment, its best to also remove the volumes:

```console
$ docker-compose down -v
```

[vs-market-badge]: https://vsmarketplacebadge.apphb.com/version/chrisjsewell.aiida-explore-vscode.svg "Current Release"
[vs-market-link]: https://marketplace.visualstudio.com/items?itemName=chrisjsewell.aiida-explore-vscode
[github-ci-badge]: https://img.shields.io/github/workflow/status/chrisjsewell/aiida-vcode-ext/Github-CI?label=Github-CI
[github-ci-link]: https://github.com/chrisjsewell/aiida-vcode-ext/actions
