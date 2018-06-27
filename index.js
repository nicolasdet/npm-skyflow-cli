#!/usr/bin/env node

'use strict';

require('skyflow-core');

const resolve = require("path").resolve;

Skyflow.CONFIG_FILE_NAME = 'skyflow.config.js';
Skyflow.Api = require(resolve(__dirname, 'src', 'Api'));
Skyflow.Shell = require(resolve(__dirname, 'src', 'Shell'));
Skyflow.Style = require(resolve(__dirname, 'src', 'Console', 'ConsoleStyle'));
Skyflow.Input = require(resolve(__dirname, 'src', 'Console', 'ConsoleInput'));
Skyflow.Output = require(resolve(__dirname, 'src', 'Console', 'ConsoleOutput'));
Skyflow.Request = require(resolve(__dirname, 'src', 'Console', 'ConsoleRequest'));

try {
    Skyflow.CurrentPackage = require(resolve(process.cwd(), 'package.json'));
} catch (e) {
    Skyflow.CurrentPackage = {};
}
Skyflow.Package = require('./package.json');
Skyflow.React = {
    sample() {
        let s = resolve(__dirname, 'resources', 'react', 'sample');
        return Skyflow.File.read(s);
    }
};

// Configuration

Skyflow.Conf = {};
/**
 * Check if skyflow configuration exists in current directory.
 * Set default configuration.
 */
Skyflow.currentConfMiddleware = () => {
    const configFile = resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME);
    if (!Skyflow.File.exists(configFile)) {
        Skyflow.Output.error("Configuration file not found.", false);
        Skyflow.Output.info("Run 'skyflow init' command.", false);
        process.exit(1);
    }
    Skyflow.Conf = require(configFile);
    if (!Skyflow.Conf.env) {
        Skyflow.Conf.env = 'dev';
    }
};

Skyflow.getUserHome = ()=>{
    return process.env[Skyflow.isWindows() ? 'USERPROFILE' : 'HOME'];
};

/**
 * Set current configuration file
 */
const configFile = resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME);
if (Skyflow.File.exists(configFile)) {
    Skyflow.Conf = require(configFile);
}

const File = Skyflow.File,
    Output = Skyflow.Output,
    Helper = Skyflow.Helper,
    Request = Skyflow.Request,
    Shell = Skyflow.Shell;

// Run current shell

const currentShell = File.read(resolve(__dirname, 'src', 'Shell', '.current')),
    shellPath = resolve(__dirname, 'src', 'Shell', currentShell);

if(Request.getCommands()['shell'] !== 0 && File.exists(shellPath)){

    const shell = require(shellPath);

    if(!Helper.isFunction(shell['run'])){
        Output.error('Run method not found in ' + currentShell.replace(/Shell\.js$/, '') + ' shell.', false);
        process.exit(0);
    }

    shell['run'].apply(shell['run'], [Request.getCommands(), Request.getOptions()]);

}else {

    // Run basics commands

    const DefaultCommand = require(resolve(__dirname, 'src', 'Command', 'DefaultCommand'));

    if (!Request.hasCommand() && !Request.hasOption()) {
        DefaultCommand.help.apply(Skyflow);
    }else if ((Request.hasOption('v') || Request.hasOption('version')) && !Request.hasCommand()) {
        DefaultCommand.version.apply(Skyflow);
    }else if ((Request.hasOption('h') || Request.hasOption('help'))) {
        let command = undefined;
        if (Request.hasCommand()) {
            const commands = Request.getCommands();
            for (let c in commands) {
                if (commands.hasOwnProperty(c)) {
                    command = c;
                    break
                }
            }
        }
        DefaultCommand.help.apply(Skyflow, [command]);
    }else {

        // Register and dispatch commands

        let commands = [
            Skyflow.getConfig('commands') || {},
            require(resolve(__dirname, 'resources', 'defaultCommands'))
        ];

        commands.forEach((command) => {
            for (let c in command) {
                if (command[c].hasOwnProperty('callback')) {
                    Request.registerCommand(c, command[c]['callback']);
                }
            }
        });

        Request.dispatchCommands();

    }

}

