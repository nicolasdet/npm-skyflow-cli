#!/usr/bin/env node

'use strict';

require('skyflow-core');

const resolve = require("path").resolve;

Skyflow.getUserHome = () => {
    return process.env[Skyflow.isWindows() ? 'USERPROFILE' : 'HOME'];
};

Skyflow.CONFIG_FILE_NAME = 'skyflow.config.js';
Skyflow.Shell = require(resolve(__dirname, 'src', 'Shell'));
Skyflow.Style = require(resolve(__dirname, 'src', 'Console', 'ConsoleStyle'));
Skyflow.Input = require(resolve(__dirname, 'src', 'Console', 'ConsoleInput'));
Skyflow.Output = require(resolve(__dirname, 'src', 'Console', 'ConsoleOutput'));
Skyflow.Request = require(resolve(__dirname, 'src', 'Console', 'ConsoleRequest'));
Skyflow.Api = require(resolve(__dirname, 'src', 'Api'));

const Request = Skyflow.Request,
    Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    DefaultCommand = require(resolve(__dirname, 'src', 'Command', 'DefaultCommand'));

try {
    Skyflow.Conf = require(resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME));
} catch (e) {
    Skyflow.Conf = {};
}

try {
    Skyflow.CurrentPackage = require(resolve(process.cwd(), 'package.json'));
} catch (e) {
    Skyflow.CurrentPackage = {};
}

Skyflow.Package = require('./package.json');

if (!Request.hasCommand() && !Request.hasOption()) {
    DefaultCommand.help.apply(null);
    process.exit(0);
}

if (!Request.hasCommand()) {

    if (Request.hasOption('v') || Request.hasOption('version')) {
        DefaultCommand.version.apply(null);
        process.exit(0);
    }

    if (Request.hasOption('h') || Request.hasOption('help')) {
        DefaultCommand.help.apply(null);
        process.exit(0);
    }

    process.exit(0);
}

let commands = process.argv.slice(2)[0].split(':'),
    moduleName = commands[0],
    Module = Helper.upperFirst(moduleName);

try {
    // Get alias
    Module = require(resolve(__dirname, 'src', 'Module', Module + 'Module'));
} catch (e) {
    Output.error('Module ' + Module + ' not found.', false);
    process.exit(0);
}

commands = commands.splice(1);

if ((Helper.isEmpty(commands) && !Request.hasOption()) || (Helper.isEmpty(commands) && (Request.hasOption('h') || Request.hasOption('help')))) {
    DefaultCommand.help.apply(null, [moduleName]);
    process.exit(0);
}

if (Helper.isEmpty(commands) && Module[moduleName]) {
    Module[moduleName].apply(Module);
} else {
    Module.dispatcher.apply(Module, [...commands]);
}

