#!/usr/bin/env node

'use strict';

require('skyflow');

const resolve = require("path").resolve;

Skyflow.CONFIG_FILE_NAME = 'skyflow.config.js';
Skyflow.Style = require(resolve(__dirname, 'src', 'Console', 'ConsoleStyle'));
Skyflow.Input = require(resolve(__dirname, 'src', 'Console', 'ConsoleInput'));
Skyflow.Output = require(resolve(__dirname, 'src', 'Console', 'ConsoleOutput'));
Skyflow.Request = require(resolve(__dirname, 'src', 'Console', 'ConsoleRequest'));

if(Skyflow.File.exists(resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME))){
    Skyflow.CONF = require(resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME));
}

const DefaultCommand = require(resolve(__dirname, 'src', 'Command', 'DefaultCommand'));

if (!Skyflow.Request.hasCommand() && !Skyflow.Request.hasOption()) {
    DefaultCommand.help.apply(Skyflow);
    process.exit(0)
}
if ((Skyflow.Request.hasOption('v') || Skyflow.Request.hasOption('version')) && !Skyflow.Request.hasCommand()) {
    DefaultCommand.version.apply(Skyflow);
    process.exit(0)
}
if ((Skyflow.Request.hasOption('h') || Skyflow.Request.hasOption('help'))) {
    let command = undefined;
    if (Skyflow.Request.hasCommand()) {
        const commands = Skyflow.Request.getCommands();
        for (let c in commands) {
            if (commands.hasOwnProperty(c)) {
                command = c;
                break
            }
        }
    }
    DefaultCommand.help.apply(Skyflow, [command]);
    process.exit(0)
}

// Register commands

let commands = [
    Skyflow.getConfig('commands') || {},
    require(resolve(__dirname, 'resources', 'defaultCommands'))
];

commands.forEach((command) => {
    for (let c in command) {
        if (command[c].hasOwnProperty('callback')) {
            Skyflow.Request.registerCommand(c, command[c]['callback']);
        }
    }
});

Skyflow.Request.dispatchCommands();