<div align="center">
    <a href="https://skyflow.io/">
        <img width="300" src="resources/images/skyflow.png">
    </a>
</div>

<h1 align="center">Best friend of the developer</h1>

**Skyflow-cli** is a command line that makes life easier for developers.
<br />
With **Skyflow-cli** you can:

- Manage your development and production environments with **Docker**.
- Manage and compile your assets with **Webpack**.
- Quickly integrate **React** into your projects.
- _And much more ..._

### Prerequisites

------------

**Skyflow-cli** is developed in Nodejs. You need [Nodejs](https://nodejs.org) or [Yarn](https://yarnpkg.com).


### Installation

------------

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

### Usage

------------

To use the command line, you must generate the [configuration](./documentation/CONFIG.md) file with the following command:

```
skyflow init
```

This will create a `skyflow.config.js` configuration file in the current folder.


### Usage with Docker

------------

[Docker module](./documentation/modules/DOCKER.md) is a native module of **Skyflow-cli**. To use it, activate the [Docker Shell](./documentation/SHELL.md) with this command

```
skyflow shell docker
```

Now you can use the [Docker module](./documentation/modules/DOCKER.md) commands.

_**Help for Docker module**_

```
skyflow help
```

_**List available composes**_

```
skyflow compose --list
```