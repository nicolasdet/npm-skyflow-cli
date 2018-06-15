<a align="center" href="https://skyflow.io/">
	<img width="300" src="resources/images/skyflow.png">
</a>

## Skyflow - Best friend of the developer


Skyflow make life easier for the developer.

### Prerequisites

------------

Skyflow is developed in Nodejs. You need [Nodejs](https://nodejs.org) or [Yarn](https://yarnpkg.com).

### Installation

------------

With npm
```
npm install skyflow-cli-g
```

With yarn
```
yarn global add skyflow-cli
```

### Usage

------------

Get version
```
skyflow -v
```

Get help
```
skyflow -h
```

Initialize skyflow
```
skyflow init
```

skyflow init command generate configuration file "skyflow.config.js".

### Configuration

------------
- Configuration file name -> "skyflow.config.js".

#### Choose your environment type

Example :
```javascript
env:'dev'
```

#### Create your first command

```javascript
module.exports = {
    commands: {
         commandName: {
             description: "Description of command",
             options: {
                 option1: "Description of option",
                 option2: "Description of option",
             },
             since: "1.0.0",
             callback: ()=>{
                 console.log(this);
             }
         }
    }
};
```

#### Invokable

```javascript
module.exports = {
    container: {
        invokable: {
            // Use invoke method for this array
            // Stores only callable functions
        }
    }
};
```

#### Service

```javascript
module.exports = {
    container: {
        service: {
            // Use get method for this array
        },
        invokable: {
            // Use invoke method for this array
            // Stores only callable functions
        }
    }
};
```

#### Module
Module tab contain configuration for each module.
Example docker configuration, file module finding in Module directory.

```javascript
module.exports = {
    modules: {
            docker: {
                directory: 'docker'
            }
        }
};
```