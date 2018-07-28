'use strict';

const resolve = require('path').resolve,
    fs = require('fs'),
    os = require('os');

const Shell = Skyflow.Shell,
    Api = Skyflow.Api,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Request = Skyflow.Request,
    Output = Skyflow.Output;

function getDockerDirFromConfig() {

    let currentDockerDir = Skyflow.getConfig('modules.docker.directory') || 'docker';

    Directory.create(currentDockerDir);

    return currentDockerDir;
}

function runDockerComposeCommand(command, options = []) {

    let cwd = process.cwd();
    process.chdir(getDockerDirFromConfig());
    Shell.exec('docker-compose ' + command + ' ' + options.join(' '));
    process.chdir(cwd)

}

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
            if (Skyflow.isInux()) {
                fs.chmodSync(dest, '777')
            }
        }

        let storage = {
            composes: {},
            dockerfiles: {}
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

            let composeDir = resolve(dockerDir, compose),
                dockerfile = "",
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
                if (Skyflow.isInux()) {
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
                if (Skyflow.isInux()) {
                    fs.chmodSync(dest, '777')
                }

            }

        }

        for (let compose in storage.composes) {
            Output.success(compose + " added into docker-compose.yml.");
        }
    }

    let allQuestions = [];

    composes.forEach((compose) => {

        if (!Directory.exists(resolve(dockerDir, compose))) {
            Output.error("Compose " + compose + " not found.", false);
            return 1
        }

        if (File.exists(resolve(dockerDir, compose, 'prompt.js'))) {
            let questions = require(resolve(dockerDir, compose, 'prompt.js')).questions;
            questions.forEach((question) => {
                question.message = "[" + compose + "] " + question.message;
                question.name = "__" + compose + "__" + question.name;
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

    let composeDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', compose, version);

    if (!Directory.exists(composeDir)) {
        return 1
    }

    let prompt = null;

    if (File.exists(resolve(composeDir, 'prompt.js'))) {
        prompt = resolve(composeDir, 'prompt.js')
    }

    let currentDockerDir = getDockerDirFromConfig(),
        destDir = resolve(currentDockerDir, compose);

    Directory.create(destDir);

    // Copy conf dir
    if (Directory.exists(resolve(composeDir, 'conf'))) {
        Directory.copy(resolve(composeDir, 'conf'), resolve(destDir, 'conf'))
    }

    // Copy Dockerfile
    if (File.exists(resolve(composeDir, 'Dockerfile'))) {
        let dest = resolve(destDir, 'Dockerfile.dist');
        File.copy(resolve(composeDir, 'Dockerfile'), dest);
        if (Skyflow.isInux()) {
            fs.chmodSync(dest, '777')
        }
    }

    // Copy docker-compose.yml
    if (File.exists(resolve(composeDir, compose + '.yml'))) {
        let dest = resolve(destDir, 'docker-compose.dist');
        File.copy(resolve(composeDir, compose + '.yml'), dest);
        if (Skyflow.isInux()) {
            fs.chmodSync(dest, '777')
        }
    }

    // Copy prompt file
    if (prompt) {
        let dest = resolve(destDir, 'prompt.js');
        File.copy(resolve(composeDir, 'prompt.js'), dest);
        if (Skyflow.isInux()) {
            fs.chmodSync(dest, '777')
        }
    }

    Output.success(compose + " added.");

    return 0;
}

function listCompose() {

    let list = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', 'list.js');

    function displayComposeList() {

        list = require(list);

        Output.newLine();
        Output.writeln('Available compose:', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        for (let name in list) {
            if (!list.hasOwnProperty(name)) {
                continue;
            }
            Output.write(name, null, null, 'bold');
            Output.writeln(' -> compose:add ' + name.toLowerCase());
            Output.writeln(list[name], 'gray')

        }

    }

    if (!File.exists(list)) {

        Output.writeln("Pulling compose list from " + Api.protocol + '://' + Api.host + " ...", false);

        Api.get('list/docker/compose', (response) => {

            if (response.statusCode !== 200) {
                Output.error("Can not pull compose list.", false);
                process.exit(1)
            }

            let dest = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose');
            Directory.create(dest);

            File.create(resolve(dest, 'list.js'), response.body.list);
            delete response.body.list;

            if (Skyflow.isInux()) {
                fs.chmodSync(resolve(dest, 'list.js'), '777')
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

        if (command === undefined) {
            command = container;
            container = null
        }

        let options = process.argv.slice(3);

        if (container === null) {

            let c = "__compose__" + command;

            if (this[c]) {
                return this[c](options);
            }

        } else {

            let c = "__" + command;

            // Todo : Check if container exists

            if (this[c]) {
                return this[c](container, options);
            }

        }

        Output.error('Command ' + command + ' not found in Compose module.', false);

        return 1
    }

    compose(){

        if(Request.hasOption("list")){
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

        let cwd = process.cwd();
        process.chdir(getDockerDirFromConfig());
        Shell.exec('docker-compose up ' + options.join(' ') + ' ' + container);
        process.chdir(cwd);

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
            composeDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', compose);

        function runAfterPull() {

            let versions = Directory.read(composeDir, {directory: true, file: false});

            // Choices
            Input.choices(
                {
                    message: 'Choose ' + compose + ' version',
                },
                versions,
                answer => {
                    getCompose(compose, answer.response)
                }
            );

        }

        if (Directory.exists(composeDir)) {
            runAfterPull()
        }else {
            Api.pullElement('compose', compose, runAfterPull);
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

        composes.map((compose)=>{

            if(/^\-\-?/.test(compose)){
                return 1
            }

            if (!Directory.exists(resolve(dockerDir, compose))) {
                Output.error("Compose " + compose + " not found.", false);
                return 1
            }

            // Remove compose from docker-compose.yml
            let content = File.read(dest);
            content = content.replace(new RegExp(
                os.EOL + os.EOL + "# ------> " + compose + " ------>[\\s\\S]+" +
                "# <------ " + compose + " <------"
                , "m"), "");

            File.create(dest, content);
            if (Skyflow.isInux()) {
                fs.chmodSync(dest, '777')
            }

            Output.success(compose + " removed from docker-compose.yml.");

            if (Request.hasOption('dir')) {
                Directory.remove(resolve(dockerDir, compose));
                Output.success(compose + " directory removed.");
            }

        });

        return 0
    }

    __compose__update() {

        let composes = Skyflow.Request.getCommands();

        delete composes['compose:update'];

        composes = Object.keys(composes);

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

    __compose__volumes() {
        runDockerComposeCommand('config', ['--volumes']);
    }

    __compose__down(options) {
        runDockerComposeCommand('down', options);
    }

    __compose__up(options) {
        runDockerComposeCommand('up', options);
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