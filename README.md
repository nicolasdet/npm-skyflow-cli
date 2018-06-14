<div align="center">
	<img width="300" src="resources/images/skyflow.png">
</div>

## Skyflow - Best friend of the developer

---

Skyflow make life easier for the developer.

### Prerequisites
---
Skyflow is developed in nodejs. You need Nodejs or Yarn.

### Installation
---
With npm
```
npm install skyflow-cli-g
```

With yarn
```
yarn global add skyflow-cli
```

### Usage
---

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

##### Create your first command

```
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
    },


};
```

