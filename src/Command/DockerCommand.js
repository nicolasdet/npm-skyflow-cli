'use strict';

const resolve = require('path').resolve,
    fs = require('fs'),
    os = require('os'),
    path = require('path');

const Helper = Skyflow.Helper,
    Shell = Skyflow.Shell,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Output = Skyflow.Output;

const help = require(resolve(__dirname, '..', '..', 'resources', 'docker', 'cli-commands.js'));

function runCommand(command, options) {
    Shell.exec('docker-compose ' + command + ' ' + options.join(' '))
}

function updateCompose(compose) {

    Skyflow.currentConfMiddleware();

    let dockerDir = Skyflow.getConfig('modules.docker.directory');
    if (!dockerDir) {
        Output.error("Docker directory not found in modules array.", false);
        return 1
    }
    dockerDir = resolve(process.cwd(), dockerDir);

    if(!Directory.exists(resolve(dockerDir, compose))){
        Output.error("Compose " + compose + " not found.", false);
        return 1
    }

    let dest = resolve(dockerDir, 'docker-compose.yml');
    if (!File.exists(dest)) {
        let content = "version: \"2\"" + os.EOL + os.EOL +
            "services:";
        File.create(dest, content);
        if (Skyflow.isInux()) {fs.chmodSync(dest, '777')}
    }

    let composeDir = resolve(dockerDir, compose),
        dockerfile = "",
        dockerCompose = "",
        questions = [];

    if (File.exists(resolve(composeDir, 'Dockerfile.dist'))) {
        dockerfile = File.read(resolve(composeDir, 'Dockerfile.dist'))
    }
    if (File.exists(resolve(composeDir, 'docker-compose.dist'))) {
        dockerCompose = File.read(resolve(composeDir, 'docker-compose.dist'))
    }
    if (File.exists(resolve(composeDir, 'prompt.js'))) {
        questions = require(resolve(composeDir, 'prompt.js')).questions
    }

    Input.input(questions, (responses) => {

        for (let response in responses) {

            if (!responses.hasOwnProperty(response)) {
                continue
            }

            let regex = new RegExp("\{\{ ?" + response + " ?\}\}", "g");

            dockerfile = dockerfile.replace(regex, responses[response]);
            dockerCompose = dockerCompose.replace(regex, responses[response]);

        }

        if (dockerfile !== "") {
            let dest = resolve(composeDir, 'Dockerfile');
            File.create(dest, dockerfile);
            if (Skyflow.isInux()) {
                fs.chmodSync(dest, '777')
            }
        }

        if (dockerCompose !== ""){

            dockerCompose = os.EOL + os.EOL + "# ------> " + compose + " ------>" + os.EOL +
                dockerCompose + os.EOL +
                "# <------ " + compose + " <------";

            let dest = resolve(dockerDir, 'docker-compose.yml');

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

            Output.success(compose + " added into docker-compose.yml.");
        }

    });

    return 0

}

function getCompose(compose, version = null) {

    let composeDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', compose);

    let prompt = null;

    if (File.exists(resolve(composeDir, 'prompt.js'))) {
        prompt = resolve(composeDir, 'prompt.js')
    }

    if (version && Directory.exists(resolve(composeDir, version))) {

        composeDir = resolve(composeDir, version);

        if (File.exists(resolve(composeDir, 'prompt.js'))) {
            prompt = resolve(composeDir, 'prompt.js')
        }
    }

    let currentDockerDir = Skyflow.getConfig('modules.docker.directory');
    if (!currentDockerDir) {
        Output.error("Docker directory not found in modules array.", false);
        return 1
    }

    Directory.create(resolve(currentDockerDir, compose));

    // Copy conf dir
    if (Directory.exists(resolve(composeDir, 'conf'))) {
        Directory.copy(resolve(composeDir, 'conf'), resolve(currentDockerDir, compose, 'conf'))
    }

    // Copy Dockerfile
    if (File.exists(resolve(composeDir, 'Dockerfile'))) {
        let dest = resolve(currentDockerDir, compose, 'Dockerfile.dist');
        File.copy(resolve(composeDir, 'Dockerfile'), dest);
        if (Skyflow.isInux()) {fs.chmodSync(dest, '777')}
    }

    // Copy docker-compose.yml
    if (File.exists(resolve(composeDir, compose + '.yml'))) {
        let dest = resolve(currentDockerDir, compose, 'docker-compose.dist');
        File.copy(resolve(composeDir, compose + '.yml'), dest);
        if (Skyflow.isInux()) {fs.chmodSync(dest, '777')}
    }

    // Copy prompt file
    if (prompt) {
        let dest = resolve(currentDockerDir, compose, 'prompt.js');
        File.copy(resolve(composeDir, 'prompt.js'), dest);
        if (Skyflow.isInux()) {fs.chmodSync(dest, '777')}
    }

    return updateCompose(compose)
}


// Todo:
// container:inspect

class DockerCommand {


    help() {
        Output.newLine();

        Output.writeln('For more details see:');
        Output.writeln('https://docs.docker.com/compose/reference', 'blue');
        Output.writeln('https://docs.docker.com/engine/reference/commandline/cli', 'blue');

        Output.newLine();

        for (let h in help) {

            Output.writeln(h, 'green', null, 'bold');

            // Description
            if (help[h]['description']) {
                Output.writeln(help[h]['description'])
            }

            // Options
            const options = help[h]['options'];
            if (Helper.isObject(options) && !Helper.isEmpty(options)) {
                Output.writeln('Options:', 'cyan', null, 'underline');
                for (let o in options) {
                    Output.write(o, 'magenta').space(2).writeln(options[o]);
                }
            }

            Output.newLine()

        }
    }

    build(options) {
        runCommand('build', options);
    }

    config(options) {
        runCommand('config', options);
    }

    services() {
        let options = ['config', '--services'];
        Shell.run('docker-compose', options);
        if (Shell.hasError()) {
            Output.error("An error occurred while running the command 'docker-compose config --services'")
        } else {
            if (Shell.getArrayResult().length === 0) {
                Output.info('No volumes!');
                Output.newLine();
            } else {
                Output.writeln(Shell.getResult());
            }
        }
    }

    volumes() {
        let options = ['config', '--volumes'];
        Shell.run('docker-compose', options);
        if (Shell.hasError()) {
            Output.error("An error occurred while running the command 'docker-compose config --volumes'")
        } else {
            if (Shell.getArrayResult().length === 0) {
                Output.writeln('No volumes!', 'blue')
            } else {
                Output.writeln(Shell.getResult());
            }
        }
    }

    down(options) {
        runCommand('down', options);
    }

    kill(options) {
        runCommand('kill', options);
    }

    logs(options) {
        runCommand('logs', options);
    }

    port(options) {
        runCommand('port', options);
    }

    ps(options) {
        if (options.indexOf('-q') > -1) {
            options = ['-q'];
        } else {
            options = [];
        }
        runCommand('ps', options);
    }

    restart(options) {
        runCommand('restart', options);
    }

    rm(options) {
        runCommand('rm', options);
    }

    up(options) {
        runCommand('up', options);
    }

    start(options) {
        runCommand('start', options);
    }

    stop(options) {
        runCommand('stop', options);
    }

    ls(options) {

        let what = 'container';

        let index = options.indexOf('image');
        if (index > -1) {
            what = 'image';
            options[index] = null
        }

        index = options.indexOf('images');
        if (index > -1) {
            what = 'image';
            options[index] = null
        }

        index = options.indexOf('container');
        if (index > -1) {
            what = 'container';
            options[index] = null
        }

        index = options.indexOf('containers');
        if (index > -1) {
            what = 'container';
            options[index] = null
        }

        Shell.exec('docker ' + what + ' ls ' + options.join(' '));

    }

    rmc(options) {

        let force = false;
        if (options.indexOf('-f') > -1 || options.indexOf('--force') > -1) {
            force = true;
        }

        if (options.indexOf('-a') > -1 || options.indexOf('--all') > -1) {
            Shell.run('docker', ['container', 'ls', '-a', '-q']);
            options = Shell.getArrayResult();
            if (options.length === 0) {
                Output.info('No containers found!', false);
                return 0;
            }
        }

        if (force) {
            options.unshift('-f')
        }

        options.unshift('container', 'rm');

        Shell.run('docker', options);
        Output.writeln(Shell.getResult());
        Output.success('Success!', false);
        Output.newLine();

    }

    rmi(options) {
        let force = false;
        if (options.indexOf('-f') > -1 || options.indexOf('--force') > -1) {
            force = true;
        }

        if (options.indexOf('-a') > -1 || options.indexOf('--all') > -1) {
            Shell.run('docker', ['image', 'ls', '-a', '-q']);
            options = Shell.getArrayResult();
            if (options.length === 0) {
                Output.info('No images found!', false);
                return 0;
            }
        }

        if (force) {
            options.unshift('-f')
        }

        options.unshift('image', 'rm');

        Shell.run('docker', options);
        Output.writeln(Shell.getResult());
        Output.success('Success!', false);
        Output.newLine();

    }


    __exec(container, options) {

        Shell.exec('docker-compose exec ' + container + ' ' + options.join(' '))

    }

    __sh(container) {

        runCommand('exec ' + container, ['sh']);

    }

    __bash(container) {

        runCommand('exec ' + container, ['bash']);

    }

    __up(container, options) {

        Shell.exec('docker-compose up ' + options.join(' ') + ' ' + container);

    }

    __pull(container, options) {

        runCommand('pull ' + container, options);

    }

    __stop(container, options) {

        runCommand('stop ' + container, options);

    }

    __start(container, options) {

        runCommand('start ' + container, options);

    }

    __rm(container, options) {

        runCommand('stop ' + container, options);
        runCommand('rm', options);

    }


    __compose__add(composes) {

        if (composes.length === 0) {
            return this.__compose__list()
        }

        let compose = composes[0],
            composeDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', compose);

        if (!Directory.exists(composeDir)) {
            // Pull all version of compose from skyflow
            console.log("Pull " + compose + " from skyflow.io");
            return 1
        }

        let versions = Directory.read(composeDir, {directory: true, file: false, filter: /^(v-|version-)/});

        if(versions.length === 0){
            return getCompose(compose)
        }

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

        return 0
    }

    __compose__rm(composes, options) {

        let compose = composes[0];

        if(!compose){Output.error("Missing argument.", false); return 1}

        Skyflow.currentConfMiddleware();

        let dockerDir = Skyflow.getConfig('modules.docker.directory');
        if (!dockerDir) {
            Output.error("Docker directory not found in modules array.", false);
            return 1
        }
        dockerDir = resolve(process.cwd(), dockerDir);

        let dest = resolve(dockerDir, 'docker-compose.yml');
        if (!File.exists(dest)) {
            Output.error("docker-compose.yml not found.", false);
            return 1
        }
        if(!Directory.exists(resolve(dockerDir, compose))){
            Output.error("Compose " + compose + " not found.", false);
            return 1;
        }

        // Remove compose from docker-compose.yml
        let content = File.read(dest);
        content = content.replace(new RegExp(
            os.EOL + os.EOL + "# ------> " + compose + " ------>[\\s\\S]+" +
            "# <------ " + compose + " <------"
            , "m"), "");

        File.create(dest, content);
        if (Skyflow.isInux()) {fs.chmodSync(dest, '777')}

        Output.success(compose + " removed from docker-compose.yml.");

        if(options['dir']){
            Directory.remove(resolve(dockerDir, compose));
            Output.success(compose + " directory removed.");
        }

        return 0
    }

    __compose__update(composes) {

        let compose = composes[0];

        if(!compose){Output.error("Missing argument.", false); return 1}

        return updateCompose(compose)
    }

    __compose__list() {

        let list = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'compose', 'list.js');
        if (!File.exists(list)) {
            console.log("Pull list.js from skyflow.io");
            return 1
        }

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

        return 0;
    }

    __compose__up() {
        console.log('up');
    }


}

module.exports = new DockerCommand();