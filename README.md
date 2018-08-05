<div align="center">
    <a href="https://skyflow.io/">
        <img width="300" src="extra/images/skyflow.png">
    </a>
</div>

<h1 align="center">Best friend of the developer</h1>

**Skyflow-cli** is a command line that makes life easier for developers.
<br />
With **Skyflow-cli** you can:

- Manage your development and production environments with **Docker**.
- Manage and compile your assets with **Webpack** (in progress).
- Quickly integrate **React** into your projects (in progress).
- _And more ..._

## Prerequisites

**Skyflow-cli** is developed in Nodejs. You need [Nodejs](https://nodejs.org) or [Yarn](https://yarnpkg.com).
Skyflow-cli was developed for **Mac OX** and **Unix** systems.


## Installation

_**With npm**_

```
npm install -g skyflow-cli
```

_**With yarn**_

```
yarn global add skyflow-cli
```

_**Check command line version**_

```
skyflow -v
```

or 

```
skyflow --version
```

_**Need help?**_

```
skyflow -h
```

or 

```
skyflow --help
```

## Usage

To use the command line, you must generate the [configuration](doc/CONFIG.md) file with the following command:

```
skyflow init
```

This will create a `skyflow.config.js` configuration file in the current folder.


## Usage with Docker

[Docker module](doc/modules/DOCKER.md) is a native module of **Skyflow-cli**. To use it, activate the [Docker Shell](doc/SHELL.md) with this command

```
skyflow shell docker
```

Now you can use the [Docker module](doc/modules/DOCKER.md) commands.

_**Help for Docker module**_

```
skyflow help
```

_**List available compose**_

A **Compose** is the docker-compose service already configured and ready for use. 
See [Docker module](doc/modules/DOCKER.md) for more details.
<br/>
Use the following command to list the available compose:

```
skyflow compose --list
```

_**List available package**_

A **Package** contains all the configuration needed to start working. A package is a combination of composes.
<br/>
Use the following command to list the available package:

```
skyflow package --list
```

## Example of docker integration in a project

1. Generate configuration file
```
skyflow init
```

2. Enter in Docker shell
```
skyflow shell docker
```

3. Add `mariadb` compose
```
skyflow compose:add mariadb
```

4. Add `adminer` compose
```
skyflow compose:add adminer
```

When adding a compose, some information may be required.

5. Build, (re)create, start, and attache to containers for a service.
```
skyflow compose:up -d --build
```

If you have left the default information, you can access Adminer via: `localhost:8080`
The information for the database is:
- host : `mariadb`
- Database name : `skyflow`
- Database user : `skyflow`
- Database password : `root`

6. Stop all service
```
skyflow compose:stop
```

7. Stops containers and removes containers, networks, volumes, and images created by up.
```
skyflow compose:down
```

8. Stop `mariadb` service

```
skyflow mariadb:stop
```

9. Enter into `adminer` service

```
skyflow adminer:sh
```

10. Execute command into running `adminer` service

```
skyflow adminer:exec apk update
```

11. Run and execute command into `adminer` service

```
skyflow adminer:run apk update
```


## Documentation

The documentation is divided into several sections:

- [Configuration](doc/CONFIG.md)
- [Shell](doc/SHELL.md)
- [Docker module](doc/modules/DOCKER.md)


## Contributing

_**Skyflow-cli**_ is composed of many modules. You can freely contribute to one of the modules.

- [Docker module](https://github.com/skyflow-io/skyflow-docker-module)


## License

Skyflow-cli is [Apache licensed](LICENSE).