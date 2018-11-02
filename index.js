#!/usr/bin/env node

'use strict';

require('skyflow-core');
const _ = require('lodash'),
    resolve = require("path").resolve;

Skyflow.Shell = require(resolve(__dirname, 'src', 'Shell'));
Skyflow.Style = require(resolve(__dirname, 'src', 'Console', 'ConsoleStyle'));
Skyflow.Input = require(resolve(__dirname, 'src', 'Console', 'ConsoleInput'));
Skyflow.Output = require(resolve(__dirname, 'src', 'Console', 'ConsoleOutput'));
Skyflow.Request = require(resolve(__dirname, 'src', 'Console', 'ConsoleRequest'));
Skyflow.Api = require(resolve(__dirname, 'src', 'Api'));

const Request = Skyflow.Request,
    Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Shell = Skyflow.Shell,
    Api = Skyflow.Api,
    DefaultCommand = require(resolve(__dirname, 'src', 'Command', 'DefaultCommand')),
    alias = require(resolve(__dirname, 'extra', 'alias.json'));

Skyflow.Package = require('./package.json');

Skyflow.getCurrentDockerDir = () => {

    let currentDockerDir = 'docker';
    Shell.mkdir('-p', currentDockerDir);

    return currentDockerDir;
};

Skyflow.getCurrentAssetDir = () => {
    let currentAssetDir = 'assets';
    Shell.mkdir('-p', currentAssetDir);
    return currentAssetDir;
};

Skyflow.getComposeValues = (compose) => {

    let values = {},
        file = resolve(Skyflow.getCurrentDockerDir(), compose, compose + '.values.js');
    if(File.exists(file)){
        values = require(file)
    }

    return values
};

// Todo : List modules

if (!Request.hasCommand() && !Request.hasOption()) {
    DefaultCommand.help.apply(null);
}else if (!Request.hasCommand()) {

    if (Request.hasOption('v') || Request.hasOption('version')) {
        DefaultCommand.version.apply(null);
    } else if (Request.hasOption('h') || Request.hasOption('help')) {
        DefaultCommand.help.apply(null);
    } else if (Request.hasOption('alias')) {
        DefaultCommand.alias.apply();
    } else if (Request.hasOption('modules')) {
        DefaultCommand.modules.apply();
    } else if (Request.hasOption('invalidate') || Request.hasOption('i')) {
        DefaultCommand.invalidate.apply(null);
    }

} else {

    let commands = process.argv.slice(2)[0].split(':'),
        moduleName = commands[0],
        Module = _.upperFirst(moduleName);

    try {
        if (alias.hasOwnProperty(Module)) {
            moduleName = alias[Module];
            Module = _.upperFirst(moduleName)
        }
        Module = require(resolve(__dirname, 'src', 'Module', Module + 'Module'));
    } catch (e) {
        Output.error('Module ' + Module + ' not found.', false);
        process.exit(1);
    }

    commands = commands.splice(1);

    if ((Helper.isEmpty(commands) && !Request.hasOption()) || (Helper.isEmpty(commands) && (Request.hasOption('h') || Request.hasOption('help')))) {
        DefaultCommand.help.apply(null, [moduleName]);
    } else if (Helper.isEmpty(commands) && Module[moduleName]) {
        Module[moduleName].apply(Module);
    } else {
        Module.dispatcher.apply(Module, [...commands]);
    }

}


