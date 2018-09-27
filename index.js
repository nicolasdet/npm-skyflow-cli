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
Skyflow.shx = require('shelljs');

const Request = Skyflow.Request,
    Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    Api = Skyflow.Api,
    DefaultCommand = require(resolve(__dirname, 'src', 'Command', 'DefaultCommand')),
    alias = require(resolve(__dirname, 'extra', 'alias.json'));

Skyflow.Package = require('./package.json');

Skyflow.getCurrentDockerDir = () => {

    let currentDockerDir = 'docker';
    Directory.create(currentDockerDir);

    return currentDockerDir;
};

Skyflow.getComposeValues = (compose) => {

    let values = {},
        file = resolve(Skyflow.getCurrentDockerDir(), compose, compose + '.values.js');
    if(File.exists(file)){
        values = require(file)
    }

    return values
};

// Check for update
let delta = 4 * 60 * 60 * 1000,
    checkFile = resolve(__dirname, "extra", "check.txt");

let lastTime = parseInt(File.read(checkFile)),
    currentTime = (new Date()).getTime();

if ((currentTime - lastTime) > delta) {

    // Call API
    Api.getCliCurrentVersion((version) => {

        if(Skyflow.Package.version !== version){
            Output.newLine();
            Output.success("+-------------------------------------------------+", false);
            Output.success("|                                                 |", false);
            Output.write("|    ", "green");
            Output.write("A NEW VERSION OF SKYFLOW CLI IS AVAILABLE", null, null, "bold");
            Output.writeln("    |", "green");
            Output.success("|                                                 |", false);
            Output.write("|    ", "green");
            Output.write("Use this command to update:", null, null, null);
            Output.writeln("                  |", "green");
            Output.success("|                                                 |", false);
            Output.success("|    yarn global add skyflow-cli                  |", false);
            Output.write("|    ", "green");
            Output.write("or", null, null, null);
            Output.writeln("                                           |", "green");
            Output.success("|    npm install skyflow-cli -g                   |", false);
            Output.success("|                                                 |", false);
            Output.success("+-------------------------------------------------+", false);
            process.exit(0)
        }

    });

    Directory.remove(resolve(Helper.getUserHome(), '.skyflow'));

    File.create(checkFile, currentTime)
}


// Todo : List modules
// Todo : React install for Symfony

if (!Request.hasCommand() && !Request.hasOption()) {
    DefaultCommand.help.apply(null);
}else if (!Request.hasCommand()) {

    if (Request.hasOption('v') || Request.hasOption('version')) {
        DefaultCommand.version.apply(null);
    } else if (Request.hasOption('h') || Request.hasOption('help')) {
        DefaultCommand.help.apply(null);
    } else if (Request.hasOption('alias')) {
        DefaultCommand.alias.apply(null, [alias]);
    } else if (Request.hasOption('invalidate')) {
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


