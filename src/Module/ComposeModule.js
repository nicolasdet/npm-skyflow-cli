'use strict';

const resolve = require('path').resolve,
    fs = require('fs'),
    os = require('os'),
    Shell = Skyflow.Shell,
    Api = Skyflow.Api,
    File = Skyflow.File,
    Helper = Skyflow.Helper,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require('lodash'),
    uniqid = require('uniqid'),
    shx = require('shelljs');

function getContainerFromCompose(compose) {

    let composeDir = resolve(Skyflow.getCurrentDockerDir(), compose);

    if (!Directory.exists(composeDir)) {
        Output.error(compose + ' compose not found.', false);
        process.exit(1)
    }
    let valuesFile = resolve(composeDir, compose + '.values.js');
    if (!File.exists(valuesFile)) {
        Output.error(compose + ".values.js file not found for " + compose + " compose. \nTry 'skyflow compose:update " + compose + "' command.", false);
        process.exit(1)
    }
    let containerName = require(valuesFile)['container_name'];
    if (!containerName) {
        Output.error("Container name not found for " + compose + " compose. \nTry 'skyflow compose:update " + compose + "' command.", false);
        process.exit(1)
    }

    return containerName
}

let dockerPorts = [];

Skyflow.isPortReachable = (port = 80, host = '0.0.0.0') => {

    Shell.run('docker', ['ps', '--format', "{{.Ports}}"]);

    let dockerPorts = Shell.getArrayResult(),
        hasPort = false;

    dockerPorts.map((o) => {
        hasPort = hasPort || (o.indexOf(host + ':' + port + '->') > -1);
        return hasPort;
    });

    return hasPort;
};

Skyflow.addDockerPort = (port = 80, host = '0.0.0.0') => {
    dockerPorts.push(host + ':' + port)
};

function containerIsRunning(container) {
    Shell.run('docker', ['inspect', container]);
    if (Shell.hasError()) {
        return false
    }
    let State = JSON.parse(Shell.getResult())[0]['State'];
    return State.Running
}

function containerHasStatus(container) {
    Shell.run('docker', ['inspect', container]);
    return !Shell.hasError()
}

function displayContainerInfoAfterUp(service){

    let dockerDir = resolve(process.cwd()),
        compose = service.replace(/_\w+$/, '');

    Shell.run('docker', ['inspect', "--format='{{range $p, $conf := .NetworkSettings.Ports}} {{$p}} -> {{(index $conf 0).HostPort}} {{end}}'", service]);
    if (Shell.hasError()) {
        Output.error('An error occurred while checking ports', false);
        return 1
    }
    let ports = _.trim(Shell.getResult(), "' ");

    Shell.run('docker', ['inspect', service]);
    if (Shell.hasError()) {
        Output.error('An error occurred while checking the status', false);
        return 1
    }
    let State = JSON.parse(Shell.getResult())[0]['State'];

    if(!State.Running){
        if(State.ExitCode === 0){
            Output.success(compose + " is " + State.Status);
        }else  {
            Output.error(compose + " is " + State.Status, false);
            if(State.Error !== ''){
                Output.error(State.Error, false);
            }
        }

        Shell.run('docker', ['rm', '-f', service]);

        return State.ExitCode
    }

    if(State.Running && ports !== ""){
        Output.success(compose + " is running on " + ports);
    }

    let consoleFile = resolve(dockerDir, compose, 'console.js'),
        valuesFile = resolve(dockerDir, compose, compose + '.values.js'),
        messages = {},
        events = {},
        values = {};

    if (File.exists(valuesFile)) {
        values = require(valuesFile)
    }

    // Trigger after up events
    if (File.exists(consoleFile)) {
        events = require(consoleFile).events;
        if (events && events['up'] && events['up']['after']) {
            events['up']['after'].apply(null, [values])
        }
    }

    // Display messages
    if (File.exists(consoleFile)) {
        messages = require(consoleFile).messages;
        if (!messages) {
            return 1
        }
    }
    for (let type in messages) {
        if (!messages.hasOwnProperty(type)) {
            continue
        }
        messages[type].map((message) => {
            message = message.replace(/\{\{ *(\w+) *\}\}/ig, (match, m) => {
                return values[m]
            });
            Output[type](message, false);
        });
    }

}

function execDockerComposeCommand(command, options = []) {
    let cwd = process.cwd();
    process.chdir(Skyflow.getCurrentDockerDir());
    try {
        Shell.exec('docker-compose ' + command + ' ' + options.join(' '));
    } catch (e) {
        Output.error(e.message, false)
    }
    process.chdir(cwd)
}

/**
 * Exec docker compose by container
 * @param command
 * @param container
 * @param options
 * @param reverse Reverse container name and options
 */
function execDockerComposeCommandByContainer(command, container, options = [], reverse = false) {
    let cwd = process.cwd();
    process.chdir(resolve(Skyflow.getCurrentDockerDir()));
    Shell.run('docker-compose', ['config', '--services']);
    if (Shell.hasError()) {
        Output.error(Shell.getError(), false);
        Output.info("Try to use 'skyflow compose:update'", false);
        process.exit(1)
    }
    if (_.indexOf(Shell.getArrayResult(), container) === -1) {
        Output.error('Service ' + container + ' not found in docker-compose.yml file.', false);
        process.exit(1)
    }

    try {
        if (reverse) {
            Shell.exec('docker-compose ' + command + ' ' + options.join(' ') + ' ' + container);
        } else {
            Shell.exec('docker-compose ' + command + ' ' + container + ' ' + options.join(' '));
        }
    } catch (e) {
        Output.error(e.message, false)
    }

    process.chdir(cwd)
}

function updateCompose(composes = []) {

    let dockerDir = Skyflow.getCurrentDockerDir();

    if (!composes[0]) {
        composes = Directory.read(dockerDir, {directory: true, file: false});
    }

    function questionsCallback(responses) {

        let dest = resolve(dockerDir, 'docker-compose.yml');
        if (!File.exists(dest)) {
            let content = "version: \"3\"" + os.EOL + os.EOL +
                "services:";
            File.create(dest, content);
            shx.chmod(777, dest);
        }

        let storage = {
            composes: {},
            dockerfiles: {},
            values: {}
        };

        for (let response in responses) {

            if (!responses.hasOwnProperty(response)) {
                continue
            }

            let compose = null;

            response = response.replace(/^__([a-z0-9_\-]+)__/i, (m, c) => {
                compose = c;
                return '';
            });

            let composeDir = resolve(dockerDir, compose), config = null,
                configFile = resolve(composeDir, 'console.js');

            if (File.exists(configFile)) {
                config = require(configFile);
            }

            if (!storage.values[compose]) {
                storage.values[compose] = {};

                if (config.events && config.events.update && config.events.update.before) {
                    config.events.update.before.apply(null)
                }

            }

            storage.values[compose][response] = responses["__" + compose + "__" + response];

            let dockerfile = "",
                dockerCompose = "";

            if (File.exists(resolve(composeDir, 'Dockerfile.dist')) && !storage.dockerfiles[compose]) {
                storage.dockerfiles[compose] = File.read(resolve(composeDir, 'Dockerfile.dist'))
            }
            if (File.exists(resolve(composeDir, 'docker-compose.dist')) && !storage.composes[compose]) {
                storage.composes[compose] = File.read(resolve(composeDir, 'docker-compose.dist'))
            }

            let regex = new RegExp("\{\{ ?" + response + " ?\}\}", "g");

            // Update Dockerfile
            dockerfile = storage.dockerfiles[compose];

            if (dockerfile) {
                dockerfile = dockerfile.replace(regex, responses["__" + compose + "__" + response]);
                storage.dockerfiles[compose] = dockerfile;
                let dest = resolve(composeDir, 'Dockerfile');
                File.create(dest, dockerfile);
                shx.chmod(777, dest);
            }

            // Update docker-compose.yml
            dockerCompose = storage.composes[compose];

            if (dockerCompose) {

                dockerCompose = dockerCompose.replace(regex, responses["__" + compose + "__" + response]);
                storage.composes[compose] = dockerCompose;

                dockerCompose = os.EOL + os.EOL + "# ------> " + compose + " ------>" + os.EOL +
                    dockerCompose + os.EOL +
                    "# <------ " + compose + " <------";

                dest = resolve(dockerDir, 'docker-compose.yml');

                // Remove previous compose from docker-compose.yml
                let content = File.read(dest);
                content = content.replace(new RegExp(
                    os.EOL + os.EOL + "# ------> " + compose + " ------>[\\s\\S]+" +
                    "# <------ " + compose + " <------"
                    , "m"), "");

                content += dockerCompose;

                File.create(dest, content);
                shx.chmod(777, dest);

            }

        }

        // Replace dependencies

        let content = File.read(dest);

        content = content.replace(/{{ ?depends:([a-z0-9\.]+) ?}}/g, (m, compose) => {

            if (storage.values[compose]) {
                return storage.values[compose]['container_name']
            }

            Output.error("Compose " + compose + " not found! Your docker-compose.yml file is not valid.", false);

            return m
        });

        File.create(dest, content);
        shx.chmod(777, dest);


        // Create compose values file.

        for (let compose in storage.values) {

            if (!storage.values.hasOwnProperty(compose)) {
                continue;
            }

            let composeDir = resolve(dockerDir, compose);

            if (!Directory.exists(composeDir)) {
                continue;
            }
            let contents = "'use strict';\n\n";
            contents += 'module.exports = {\n';

            let values = storage.values[compose];

            for (let c in values) {
                if (!values.hasOwnProperty(c)) {
                    continue;
                }
                contents += '    ' + c + ": '" + values[c] + "',\n";
            }

            contents += "};";

            let valuesFilename = resolve(composeDir, compose + '.values.js');
            File.create(valuesFilename, contents);
            shx.chmod(777, valuesFilename);

            let config = null,
                configFile = resolve(composeDir, 'console.js');

            if (File.exists(configFile)) {
                config = require(configFile);
            }

            if (config.events && config.events.update && config.events.update.after) {
                config.events.update.after.apply(null, [values])
            }

        }

        for (let compose in storage.composes) {
            Output.success(compose + " added into docker-compose.yml.");
        }

    }

    let allQuestions = [];

    composes.forEach((compose) => {

        if (!Directory.exists(resolve(dockerDir, compose))) {
            Output.error('Compose ' + compose + ' not found.', false);
            return 1
        }

        let consoleFile = resolve(dockerDir, compose, 'console.js'),
            valuesFile = resolve(dockerDir, compose, compose + '.values.js');

        let values = null;
        if (File.exists(valuesFile)) {
            values = require(valuesFile)
        }

        if (File.exists(consoleFile)) {
            let questions = require(consoleFile).questions;
            questions.forEach((question) => {
                if (values) {
                    question.default = values[question.name]
                }
                question.message = '[' + compose + '] ' + question.message;
                question.name = '__' + compose + '__' + question.name;
                allQuestions.push(question);
            })
        }

    });

    if (!allQuestions[0]) {
        return 1
    }

    Input.input(allQuestions, (responses) => {

        composes.forEach((compose) => {
            responses['__' + compose + '__container_name'] = uniqid(compose + '_')
        });

        questionsCallback(responses)
    });

    return 0
}

function getCompose(compose, version = null) {

    let composeDir = resolve(Helper.getUserHome(), '.skyflow', 'docker', 'compose', compose);
    let composeVersionDir = resolve(composeDir, version);

    if (!Directory.exists(composeVersionDir)) {
        Output.error(compose + ' compose not found!', false);
        process.exit(1)
    }

    let currentDockerDir = Skyflow.getCurrentDockerDir(),
        destDir = resolve(currentDockerDir, compose);

    if(Request.hasOption('f') || Request.hasOption('force')){
        shx.rm('-rf', destDir);
    }

    if(shx.test('-d', destDir)){
        Output.error(compose + ' compose directory already exists. Use -f option to continue.', false);
        process.exit(1)
    }

    shx.cp("-Rfu", composeVersionDir, destDir);

    let cons = require(resolve(destDir, 'console.js'));
    if (cons.events && cons.events.add && cons.events.add.after) {
        cons.events.add.after.apply(null)
    }

    Output.success(compose + ' compose added.');

    return 0;
}

function listCompose() {

    let composeListFileName = resolve(Helper.getUserHome(), '.skyflow', 'docker', 'compose.list.js');

    function displayComposeList() {

        let composes = require(composeListFileName);

        Output.newLine();
        Output.writeln('Available composes', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        composes.map((compose) => {

            Output.write(compose.name, null, null, 'bold');
            Output.writeln(' >>> compose:add ' + compose.name.toLowerCase());

            Output.write('Versions [ ', 'gray', null);
            let versions = compose.versions.sort();
            versions.map((version) => {
                Output.write(version + ' ', 'gray', null);
            });

            Output.writeln(']', 'gray');

            Output.writeln(compose.description, 'gray')

        });

    }

    if (!File.exists(composeListFileName)) {

        Output.writeln('Pulling composes list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('docker/composes', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull composes list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                composes = [];

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Directory.create(directory);
                let configFile = resolve(directory, d.compose + '.config.json');

                File.create(configFile, d.contents);
                shx.chmod(777, configFile);

                let compose = require(configFile);
                compose['versions'] = d.versions;
                composes.push(compose);

                Directory.delete(directory);

            });

            File.create(composeListFileName, "'use strict';\n\nmodule.exports = " + JSON.stringify(composes));
            shx.chmod(777, composeListFileName);

            displayComposeList()

        });

        return 0
    }

    displayComposeList();

    return 0
}

class ComposeModule {

    // Require
    dispatcher(container, command) {

        Shell.run('docker', ['-v']);
        if (Shell.hasError()) {
            Output.error('Docker does not respond. Check if it is installed and running.', false);
            return 1
        }

        Shell.run('docker-compose', ['-v']);
        if (Shell.hasError()) {
            Output.error('Docker-compose does not respond. Check if it is installed and running.', false);
            return 1
        }

        if (command === undefined) {
            command = container;
            container = null
        }

        let options = process.argv.slice(3);

        if (container === null) {

            let c = "__compose__" + command;

            if (this[c]) {
                return this[c].apply(this, [options]);
            }

        } else {

            let c = "__" + command;

            if (this[c]) {
                return this[c].apply(this, [container, options]);
            }

        }

        Output.error('Command ' + command + (container ? (' for ' + container + ' container') : '') + ' not found in Compose module.', false);

        return 1
    }

    compose() {

        if (Request.hasOption("list")) {
            return listCompose();
        }

        return 1
    }

    /*------------ Run by container ----------*/

    __exec(compose, options) {

        let container = getContainerFromCompose(compose);

        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, options);
    }

    __sh(compose) {

        let container = getContainerFromCompose(compose);

        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, ['sh']);
    }

    __bash(compose) {

        let container = getContainerFromCompose(compose);

        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, ['bash']);
    }

    __down(compose, options) {

        Request.addOption('compose', compose);
        this['__compose__down'](options);
    }

    __pull(compose, options) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('pull', container, options);
    }

    __stop(compose, options) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('stop', container, options);
    }

    __start(compose, options) {

        let container = getContainerFromCompose(compose);

        if (!containerHasStatus(container)) {
            Output.writeln('No container to start.');
            process.exit(1)
        }
        execDockerComposeCommandByContainer('start', container, options);
    }

    __rm(compose, options) {

        let container = getContainerFromCompose(compose);

        if (!Request.hasOption('s') && !Request.hasOption('stop')) {
            options.push('-s')
        }
        execDockerComposeCommandByContainer('rm', container, options, true);
    }

    __kill(compose, options) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('kill', container, options, true);
    }

    __logs(compose, options) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('logs', container, options, true);
    }

    __restart(compose, options) {

        let container = getContainerFromCompose(compose);

        if (!containerHasStatus(container)) {
            Output.writeln('No container to restart.');
            process.exit(1)
        }
        execDockerComposeCommandByContainer('restart', container, options, true);
    }

    // Todo : In run command, add options => https://docs.docker.com/compose/reference/run/
    __run(compose, commands) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('run --rm', container, commands);
    }

    __ps(compose, options) {

        let container = getContainerFromCompose(compose);

        execDockerComposeCommandByContainer('ps', container, options);
    }

    __up(compose, options) {

        let container = getContainerFromCompose(compose);

        if (!Request.hasOption('d') && !Request.hasOption('detach') && !Request.hasOption('no-detach')) {
            options.push('-d')
        }

        if (!Request.hasOption('build') && !Request.hasOption('no-build')) {
            options.push('--build')
        }

        execDockerComposeCommandByContainer('up', container, options, true);

        process.chdir(resolve(Skyflow.getCurrentDockerDir()));

        displayContainerInfoAfterUp(container);
    }

    /*------------ Run for compose ----------*/

    __compose__add(composes) {

        if (!composes[0]) {
            Output.error("Missing argument.", false);
            process.exit(1)
        }

        let compose = composes[0],
            composeDir = resolve(Helper.getUserHome(), '.skyflow', 'docker', 'compose', compose);

        let version = null;

        if (Request.hasOption('v')) {
            version = Request.getOption('v');
            composeDir = resolve(composeDir, version);
        }

        function runAfterPull() {

            if (version) {
                return getCompose(compose, version)
            }

            let versions = Directory.read(composeDir, {directory: true, file: false});

            // Choices
            Input.choices(
                {
                    message: 'Choose ' + compose + ' compose version',
                },
                versions,
                answer => {
                    getCompose(compose, answer.response)
                }
            );

        }

        if (Directory.exists(composeDir)) {
            runAfterPull()
        } else {

            if (version) {
                Api.getDockerComposeOrPackageVersion('compose', compose, version, runAfterPull);
            } else {
                Api.getDockerComposeOrPackage('compose', compose, runAfterPull);
            }

        }

        return 0
    }

    __compose__remove(composes) {

        if (!composes[0]) {
            Output.error("Missing argument.", false);
            process.exit(1)
        }

        let dockerDir = Skyflow.getCurrentDockerDir();

        let dest = resolve(dockerDir, 'docker-compose.yml');
        let yml = true;
        if (!File.exists(dest)) {
            Output.warning("docker-compose.yml not found.", false);
            yml = false
        }

        composes.map((compose) => {

            if (/^\-\-?/.test(compose)) {
                return 1
            }

            if (!Directory.exists(resolve(dockerDir, compose))) {
                Output.error("Compose " + compose + " not found.", false);
                return 1
            }

            let composeDir = resolve(dockerDir, compose),
                configFile = resolve(composeDir, 'console.js'),
                config = null;

            if (File.exists(configFile)) {
                config = require(configFile);
            }

            if (config.events && config.events.remove && config.events.remove.before) {
                config.events.remove.before.apply(null)
            }

            if(yml){

                // Remove compose from docker-compose.yml
                let content = File.read(dest);
                content = content.replace(new RegExp(
                    os.EOL + os.EOL + "# ------> " + compose + " ------>[\\s\\S]+" +
                    "# <------ " + compose + " <------"
                    , "m"), "");

                File.create(dest, content);
                shx.chmod(777, dest);

                Output.success(compose + " removed from docker-compose.yml.");
            }

            if (Request.hasOption('dir')) {
                Directory.remove(resolve(dockerDir, compose));
                Output.success(compose + " directory removed.");
            }

            if (config.events && config.events.remove && config.events.remove.after) {
                config.events.remove.after.apply(null)
            }

        });

        return 0
    }

    __compose__update() {

        let composes = Skyflow.Request.getCommands();
        composes = Object.keys(composes);
        composes = composes.slice(1);

        return updateCompose(composes)
    }

    __compose__ps(options) {
        execDockerComposeCommand('ps', options);
    }

    __compose__build(options) {
        execDockerComposeCommand('build', options);
    }

    __compose__config(options) {
        execDockerComposeCommand('config', options);
    }

    __compose__services() {
        execDockerComposeCommand('config', ['--services']);
    }

    __compose__ls() {
        execDockerComposeCommand('config', ['--services']);
    }

    __compose__volumes() {
        execDockerComposeCommand('config', ['--volumes']);
    }

    __compose__down(options) {

        const cwd = process.cwd();
        let dockerDir = resolve(Skyflow.getCurrentDockerDir());
        process.chdir(dockerDir);

        Shell.run('docker-compose', ['config', '--services']);
        if (Shell.hasError()) {
            Output.error("Check that the docker-compose.yml file exists and is valid.", false);
            Output.info("Use 'skyflow compose:update' command to generate it.", false);
            return 1
        }

        let services;

        if (Request.hasOption('compose')) {
            process.chdir(cwd);
            services = [getContainerFromCompose(Request.getOption('compose'))];
            process.chdir(dockerDir);
        } else {
            services = Shell.getArrayResult()
        }

        if (!Request.hasOption('force')) {
            options.push('--force')
        }

        services.map((service) => {

            Shell.run('docker', ['inspect', service]);
            if (Shell.hasError()) {
                return 1
            }

            Output.write('Stopping and removing ' + service + ' container ... ', null, null, null);

            Shell.run('docker', ['rm', ...options, service]);

            Output.writeln('OK', 'green', null)

        });

        process.chdir(cwd);
        execDockerComposeCommand('ps', []);
    }

    __compose__up(options) {

        let dockerDir = resolve(Skyflow.getCurrentDockerDir());

        process.chdir(dockerDir);

        Output.writeln('Checking services ...', false);

        Shell.run('docker-compose', ['config', '--services']);
        if (Shell.hasError()) {
            Output.error("Check that the docker-compose.yml file exists and is valid.", false);
            Output.info("Use 'skyflow compose:update' command to generate it.", false);
            return 1
        }
        let services = Shell.getArrayResult(),
            stringOpt = options.join(' ');

        if (!Request.hasOption('d') && !Request.hasOption('detach') && !Request.hasOption('no-detach')) {
            stringOpt += ' -d';
        }

        if (!Request.hasOption('build') && !Request.hasOption('no-build')) {
            stringOpt += ' --build';
        }

        try {
            Shell.exec('docker-compose up ' + stringOpt);
        } catch (e) {
            Output.error(e.message, false);
        }

        services.map((service)=>{

            displayContainerInfoAfterUp(service)

        });

    }

    __compose__kill(options) {
        execDockerComposeCommand('kill', options);
    }

    __compose__logs(options) {
        execDockerComposeCommand('logs', options);
    }

    __compose__restart(options) {
        execDockerComposeCommand('restart', options);
    }

    __compose__stop(options) {
        execDockerComposeCommand('stop', options);
    }

    __compose__start(options) {
        execDockerComposeCommand('start', options);
    }

    __compose__rm(options) {
        if (!Request.hasOption('s') && !Request.hasOption('stop')) {
            options.push('-s')
        }
        execDockerComposeCommand('rm', options);
    }

    __compose__pull(options) {
        execDockerComposeCommand('pull', options);
    }

    __compose__invalidate() {

        let compose = 'compose',
            composeDir = resolve(Helper.getUserHome(), '.skyflow', 'docker');

        if (Request.hasOption('compose')) {
            compose += ':' + Request.getOption('compose');
            composeDir = resolve(composeDir, ...(compose.split(':')))
        }

        Directory.remove(composeDir);

        Output.success(compose + ' cache has been successfully removed.');
    }

}

const _ComposeModule = new ComposeModule();

module.exports = _ComposeModule;