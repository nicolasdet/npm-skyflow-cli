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

function getDockerDirFromConfig() {

    let currentDockerDir = 'docker';

    Directory.create(currentDockerDir);

    return currentDockerDir;
}

function runDockerComposeCommand(command, options = []) {
    let cwd = process.cwd();
    process.chdir(getDockerDirFromConfig());
    Shell.exec('docker-compose ' + command + ' ' + options.join(' '));
    process.chdir(cwd)
}

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

function updateCompose(composes = []) {

    let dockerDir = getDockerDirFromConfig();

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
                config.events.update.after.apply(null)
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

        let config = null;
        if (File.exists(valuesFile)) {
            config = require(valuesFile)
        }

        if (File.exists(consoleFile)) {
            let questions = require(consoleFile).questions;
            questions.forEach((question) => {
                if (config) {
                    question.default = config[question.name]
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

    let currentDockerDir = getDockerDirFromConfig(),
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

    Output.success(compose + " added.");

    return 0;
}

function listCompose() {

    let composeListFileName = resolve(Helper.getUserHome(), '.skyflow', 'docker', 'compose.list.js');

    function displayComposeList() {

        let composes = require(composeListFileName);

        Output.newLine();
        Output.writeln('Available compose:', 'blue', null, 'bold');
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
        runDockerComposeCommand('exec ' + container, options);
    }

    __sh(container) {
        runDockerComposeCommand('exec ' + container, ['sh']);
    }

    __bash(container) {
        runDockerComposeCommand('exec ' + container, ['bash']);
    }

    __up(container, options) {
        Request.setOption('compose', container);
        this['__compose__up'](options);
    }

    __pull(container, options) {
        runDockerComposeCommand('pull ' + container, options);
    }

    __stop(container, options) {
        runDockerComposeCommand('stop ' + container, options);
    }

    __start(container, options) {
        runDockerComposeCommand('start ' + container, options);
    }

    __rm(container, options) {
        runDockerComposeCommand('stop ' + container, options);
        runDockerComposeCommand('rm', options);
    }

    __kill(container, options) {
        runDockerComposeCommand('kill ' + container, options);
    }

    __logs(container, options) {
        runDockerComposeCommand('logs ' + container, options);
    }

    __restart(container, options) {
        runDockerComposeCommand('restart ' + container, options);
    }

    __run(container, options) {
        runDockerComposeCommand('run --rm --name ' + container + ' ' + container, options);
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

        let dockerDir = getDockerDirFromConfig();

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
        runDockerComposeCommand('ps', options);
    }

    __compose__build(options) {
        runDockerComposeCommand('build', options);
    }

    __compose__config(options) {
        runDockerComposeCommand('config', options);
    }

    __compose__services() {
        runDockerComposeCommand('config', ['--services']);
    }

    __compose__ls() {
        runDockerComposeCommand('config', ['--services']);
    }

    __compose__volumes() {
        runDockerComposeCommand('config', ['--volumes']);
    }

    __compose__down(options) {
        Output.writeln('Stopping and removing containers ...');
        const cwd = process.cwd();
        process.chdir(resolve(getDockerDirFromConfig()));
        Shell.run('docker-compose', ['down', ...options]);
        process.chdir(cwd);
        runDockerComposeCommand('ps', []);
    }

    __compose__up(options) {

        let dockerDir = resolve(getDockerDirFromConfig()), composes = [];


        if (Request.hasOption('compose')) {
           composes = [Request.getOption('compose')]
        }else {
            composes = Directory.read(dockerDir, {directory: true, file: false})
        }

        process.chdir(dockerDir);

        Shell.run('docker-compose', ['config', '--services']);
        if (Shell.hasError()) {
            Output.error("Check that the docker-compose.yml file exists and is valid.", false);
            Output.info("Use 'skyflow compose:update' command to generate it.", false);
            return 1
        }

        let services = Shell.getArrayResult();

        composes.map((compose) => {

            let configFile = resolve(dockerDir, compose, compose + '.config.js'),
                valuesFile = resolve(dockerDir, compose, compose + '.values.js');

            if (!File.exists(configFile)) {
                Output.error('Configuration file not found for ' + compose + ' compose.', false);
                Output.info("Use 'skyflow compose:add " + compose + "' command.", false);
                Output.newLine();
                return 1
            }
            if (!File.exists(valuesFile)) {
                Output.error('Values file not found for ' + compose + ' compose.', false);
                Output.info("Use 'skyflow compose:update " + compose + "' command.", false);
                Output.newLine();
                return 1
            }

            let config = require(configFile),
                values = require(valuesFile),
                containerName = values['container_name'];

            if (config.events && config.events.up && config.events.up.before) {
                config.events.up.before.apply(null)
            }

            if (!config.up.allow) {
                return 1
            }

            if (_.indexOf(services, containerName) === -1) {
                Output.error('Service ' + containerName + ' not found in docker-compose.yml file.', false);
                Output.info("Use 'skyflow compose:update " + compose + "' command.", false);
                return 1
            }

            // Up service

            let stringOpt = options.join(' ');
            if (config.up.detach && !Request.hasOption('d') && !Request.hasOption('detach')) {
                stringOpt += ' --detach';
            }
            if (config.up.build && !Request.hasOption('build')) {
                stringOpt += ' --build';
            }

            Shell.exec('docker-compose up ' + stringOpt + ' ' + containerName);

            if (config.events && config.events.up && config.events.up.after) {
                config.events.up.after.apply(null)
            }

            // Print messages

            let messages = config.messages;
            if (!messages) {
                return 0
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

        });

    }

    __compose__kill(options) {
        runDockerComposeCommand('kill', options);
    }

    __compose__logs(options) {
        runDockerComposeCommand('logs', options);
    }

    __compose__restart(options) {
        runDockerComposeCommand('restart', options);
    }

    __compose__stop(options) {
        runDockerComposeCommand('stop', options);
    }

    __compose__start(options) {
        runDockerComposeCommand('start', options);
    }

    __compose__rm(options) {
        runDockerComposeCommand('stop', options);
        runDockerComposeCommand('rm', options);
    }

    __compose__pull(options) {
        runDockerComposeCommand('pull', options);
    }

}

module.exports = new ComposeModule();