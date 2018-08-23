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
    _ = require('lodash');

let dockerContainers = [];

Skyflow.hasDockerContainer = (container) => {

    Shell.run('docker', ['ps', '-a']);

    let lines = Shell.getArrayResult().slice(1);

    lines.map((line) => {
        let words = line.split(/ +/);
        dockerContainers.push(words[words.length - 1])
    });

    return _.indexOf(dockerContainers, container) !== -1;
};

Skyflow.addDockerContainer = (container) => {
    dockerContainers.push(container)
};

let dockerPorts = [];

Skyflow.isPortReachable = (port = 80, host = '0.0.0.0') => {

    Shell.run('docker', ['ps', '-a']);

    let lines = Shell.getArrayResult().slice(1);

    lines.map((line) => {
        let words = line.split(/ +/);
        dockerPorts.push(words[words.length - 2])
    });

    let hasPort = false;

    dockerPorts.map((o) => {
        hasPort = hasPort || (o.indexOf(host + ':' + port) > -1);
        return hasPort;
    });

    return hasPort;
};

Skyflow.addDockerPort = (port = 80, host = '0.0.0.0') => {
    dockerPorts.push(host + ':' + port)
};

Skyflow.getCurrentDockerDir = ()=>{

    let currentDockerDir = 'docker';

    Directory.create(currentDockerDir);

    return currentDockerDir;
};

function containerIsRunning(container) {
    Shell.run('docker', ['inspect', container]);
    if (Shell.hasError()) {
        return false
    }
    let inspect = JSON.parse(Shell.getResult())[0],
        state = inspect.State;
    return state.Running
}

function containerHasStatus(container) {
    Shell.run('docker', ['inspect', container]);
    return !Shell.hasError()
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
        Output.info("Use 'skyflow compose:update' command to generate it.", false);
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
            let content = "version: \"2\"" + os.EOL + os.EOL +
                "services:";
            File.create(dest, content);
            if (Skyflow.Helper.isInux()) {
                fs.chmodSync(dest, '777')
            }
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
                configFile = resolve(composeDir, compose + '.config.js');

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
                if (Skyflow.Helper.isInux()) {
                    fs.chmodSync(dest, '777')
                }
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
                if (Skyflow.Helper.isInux()) {
                    fs.chmodSync(dest, '777')
                }

            }

        }

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
            if (Helper.isInux()) {
                fs.chmodSync(valuesFilename, '777')
            }

            let config = null,
                configFile = resolve(composeDir, compose + '.config.js');

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

    Input.input(allQuestions, questionsCallback);

    return 0
}

function getCompose(compose, version = null) {

    let composeDir = resolve(Helper.getUserHome(), '.skyflow', 'docker', 'compose', compose);
    let composeVersionDir = resolve(composeDir, version);

    if (!Directory.exists(composeDir)) {
        return 1
    }

    let currentDockerDir = Skyflow.getCurrentDockerDir(),
        destDir = resolve(currentDockerDir, compose);

    Directory.create(destDir);

    Directory.copy(composeVersionDir, destDir);

    if (File.exists(resolve(destDir, compose + '.yml'))) {
        File.rename(resolve(destDir, compose + '.yml'), resolve(destDir, 'docker-compose.dist'))
    }

    if (File.exists(resolve(destDir, 'Dockerfile'))) {
        File.rename(resolve(destDir, 'Dockerfile'), resolve(destDir, 'Dockerfile.dist'))
    }

    File.copy(resolve(composeDir, compose + '.config.js'), resolve(destDir, compose + '.config.js'));
    if (Skyflow.Helper.isInux()) {
        fs.chmodSync(resolve(destDir, compose + '.config.js'), '777')
    }

    let config = require(resolve(destDir, compose + '.config.js'));

    if (config.events && config.events.add && config.events.add.after) {
        config.events.add.after.apply(null)
    }

    Output.success(compose + ' added.');

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

        Output.writeln('Pulling compose list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('docker/compose', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull compose list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                composes = [];

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Directory.create(directory);
                let configFile = resolve(directory, d.compose + '.config.js');

                File.create(configFile, d.contents);
                if (Helper.isInux()) {
                    fs.chmodSync(configFile, '777')
                }

                let compose = require(configFile);
                compose['versions'] = d.versions;
                composes.push(compose);

                Directory.delete(directory);

            });

            File.create(composeListFileName, "'use strict';\n\nmodule.exports = " + JSON.stringify(composes));
            if (Helper.isInux()) {
                fs.chmodSync(composeListFileName, '777')
            }

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

        Output.error('Command ' + command + ' not found in Compose module.', false);

        return 1
    }

    compose() {

        if (Request.hasOption("list")) {
            return listCompose();
        }

        return 1
    }

    /*------------ Run by container ----------*/

    __exec(container, options) {
        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, options);
    }

    __sh(container) {
        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, ['sh']);
    }

    __bash(container) {
        if (!containerIsRunning(container)) {
            Output.error(container + ' container is not running.', false);
            process.exit(1)
        }
        execDockerComposeCommandByContainer('exec', container, ['bash']);
    }

    __down(container, options) {
        Request.addOption('compose', container);
        this['__compose__down'](options);
    }

    __pull(container, options) {
        execDockerComposeCommandByContainer('pull', container, options);
    }

    __stop(container, options) {
        execDockerComposeCommandByContainer('stop', container, options);
    }

    __start(container, options) {
        if (!containerHasStatus(container)) {
            Output.writeln('No container to start.');
            process.exit(1)
        }
        execDockerComposeCommandByContainer('start', container, options);
    }

    __rm(container, options) {
        if (!Request.hasOption('s') && !Request.hasOption('stop')) {
            options.push('-s')
        }
        execDockerComposeCommandByContainer('rm', container, options, true);
    }

    __kill(container, options) {
        execDockerComposeCommandByContainer('kill', container, options, true);
    }

    __logs(container, options) {
        execDockerComposeCommandByContainer('logs', container, options, true);
    }

    __restart(container, options) {
        if (!containerHasStatus(container)) {
            Output.writeln('No container to restart.');
            process.exit(1)
        }
        execDockerComposeCommandByContainer('restart', container, options, true);
    }

    // Todo : In run command, add options => https://docs.docker.com/compose/reference/run/
    __run(container, commands) {
        execDockerComposeCommandByContainer('run --rm', container, commands);
    }

    __ps(container, options) {
        execDockerComposeCommandByContainer('ps', container, options);
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
        if (!File.exists(dest)) {
            Output.error("docker-compose.yml not found.", false);
            process.exit(1)
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
                configFile = resolve(composeDir, compose + '.config.js'),
                config = null;

            if (File.exists(configFile)) {
                config = require(configFile);
            }

            if (config.events && config.events.remove && config.events.remove.before) {
                config.events.remove.before.apply(null)
            }

            // Remove compose from docker-compose.yml
            let content = File.read(dest);
            content = content.replace(new RegExp(
                os.EOL + os.EOL + "# ------> " + compose + " ------>[\\s\\S]+" +
                "# <------ " + compose + " <------"
                , "m"), "");

            File.create(dest, content);
            if (Helper.isInux()) {
                fs.chmodSync(dest, '777')
            }

            Output.success(compose + " removed from docker-compose.yml.");

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
            services = [Request.getOption('compose')]
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

            Output.write('Stopping and removing ' + service + ' container ... ', 'blue', null, null);

            Shell.run('docker', ['rm', ...options, service]);

            Output.writeln('OK', 'green', null)

        });

        process.chdir(cwd);
        execDockerComposeCommand('ps', []);
    }

    __compose__up(options) {

        let dockerDir = resolve(Skyflow.getCurrentDockerDir()), composes = [];

        if (Request.hasOption('compose')) {
            composes = [Request.getOption('compose')]
        } else {
            composes = Directory.read(dockerDir, {directory: true, file: false})
        }

        process.chdir(dockerDir);

        Output.info('Checking services ...', false);

        Shell.run('docker-compose', ['config', '--services']);
        if (Shell.hasError()) {
            Output.error("Check that the docker-compose.yml file exists and is valid.", false);
            Output.info("Use 'skyflow compose:update' command to generate it.", false);
            return 1
        }
        let services = Shell.getArrayResult(),
            store = {};

        composes.map((compose) => {

            let configFile = resolve(dockerDir, compose, compose + '.config.js'),
                valuesFile = resolve(dockerDir, compose, compose + '.values.js');

            if (!File.exists(configFile)) {
                Output.error('Configuration file not found for ' + compose + ' compose.', false);
                Output.info("Use 'skyflow compose:add " + compose + "' command.", false);
                Output.newLine();
                process.exit(1);
            }
            if (!File.exists(valuesFile)) {
                Output.error('Values file not found for ' + compose + ' compose.', false);
                Output.info("Use 'skyflow compose:update " + compose + "' command.", false);
                Output.newLine();
                process.exit(1);
            }

            let config = require(configFile),
                values = require(valuesFile),
                containerName = values['container_name'];

            if (_.indexOf(services, containerName) === -1) {
                Output.error('Service ' + containerName + ' not found in docker-compose.yml file.', false);
                Output.info("Use 'skyflow compose:update " + compose + "' command.", false);
                return 1
            }

            store[compose] = {config, values};

            if (config.events && config.events.up && config.events.up.before) {
                config.events.up.before.apply(null)
            }

        });

        let stringOpt = options.join(' ');

        if (!Request.hasOption('d') && !Request.hasOption('detach') && !Request.hasOption('no-detach')) {
            stringOpt += ' -d';
        }

        if (!Request.hasOption('build') && !Request.hasOption('no-build')) {
            stringOpt += ' --build';
        }

        try {
            Shell.exec('docker-compose up ' + stringOpt);
        }catch (e) {
            Output.error(e.message, false);
            process.exit(1)
        }

        for (let data in store) {

            if (!store.hasOwnProperty(data)) {
                continue
            }

            let config = store[data].config,
                values = store[data].values,
                containerName = store[data].values['container_name'];

            // Check if container is running, Running, Paused, Restarting
            Shell.run('docker', ['inspect', containerName]);
            if (Shell.hasError()) {
                continue
            }

            let inspect = JSON.parse(Shell.getResult())[0],
                state = inspect.State;

            if (!state.Running) {

                if (state.ExitCode === 0) {
                    Output.success(containerName + ' container ' + state.Status + ' successfully.');
                } else {
                    Output.error(containerName + ' container ' + state.Status + '.', false);
                    Output.error(state.Error, false);
                }

                Shell.run('docker', ['rm', '-f', containerName]);

                continue
            }

            let ports = inspect.NetworkSettings.Ports,
                mes = containerName + ' container is ' + state.Status + ' on ';

            for (let port in ports) {

                if (!ports.hasOwnProperty(port)) {
                    continue
                }

                mes += port;

                ports[port].map((p) => {
                    mes += ' -> ' + p.HostIp + ':' + p.HostPort
                });

                break
            }

            Output.success(mes);

            // Trigger up.after callback if is defined
            if (config.events && config.events.up && config.events.up.after) {
                config.events.up.after.apply(null)
            }

            // Print messages if container is up.

            let messages = config.messages;
            if (!messages) {
                continue
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