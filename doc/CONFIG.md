<div align="center">
    <a href="https://skyflow.io/">
        <img width="300" src="../resources/images/skyflow.png">
    </a>
</div>

<h1 align="center">Configuration</h1>

**Skyflow-cli** uses a configuration file named `skyflow.config.js`. 
This file contains a lot of information for running the commands, modules, and other features of the command line.
<br />
You can generate this file with the following command:

```
skyflow init
```

## Configuration file

Here is the contents of the configuration file:

```
'use strict';

module.exports = {

    env: 'dev',

    commands: {
        // Your commands go here
    },

};
```

## Environment

You can set your environment using the `env` key.

```
'use strict';

module.exports = {

    ...
    
    env: 'dev',
    
    ...
};
```

The possible values ​​are `dev`, `prod`and `test`.


## Commands

In this configuration file you can declare your own commands in the `commands` array.

_**Example of commands declaration**_


```
'use strict';

module.exports = {

    commands: {
        myCommand: {
            description: "Description of command",
            options: {
                option1: "Description of option 1",
                option2: "Description of option 2",
            },
            since: "1.0.0",
            callback: ()=>{
                console.log(this);
            }
        }
    },


};
```

Now you can run the command with `skyflow myCommand` or get help with `skyflow myCommand -h`.
