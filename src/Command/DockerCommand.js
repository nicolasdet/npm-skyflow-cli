'use strict';

const resolve = require('path').resolve;

const Helper = Skyflow.Helper,
    Shell = Skyflow.Shell,
    Output = Skyflow.Output;

const help = require(resolve(__dirname, '..', '..', 'resources', 'docker', 'cli-commands.js'));

function runCommand(command, options) {
    Shell.exec('docker-compose ' + command + ' ' + options.join(' '))
}

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
        if(options.indexOf('-q') > -1){
            options = ['-q'];
        }else {
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
        if(index > -1){what = 'image';options[index] = null}

        index = options.indexOf('images');
        if(index > -1){what = 'image';options[index] = null}

        index = options.indexOf('container');
        if(index > -1){what = 'container';options[index] = null}

        index = options.indexOf('containers');
        if(index > -1){what = 'container';options[index] = null}

        Shell.exec('docker ' + what + ' ls ' + options.join(' '));

    }

    rmc(options){

        let force = false;
        if(options.indexOf('-f') > -1 || options.indexOf('--force') > -1){
            force = true;
        }

        if(options.indexOf('-a') > -1 || options.indexOf('--all') > -1){
            Shell.run('docker', ['container', 'ls', '-a', '-q']);
            options = Shell.getArrayResult();
            if(options.length === 0){
                Output.info('No containers found!', false);
                return 0;
            }
        }

        if(force){options.unshift('-f')}

        options.unshift('container', 'rm');

        Shell.run('docker', options);
        Output.writeln(Shell.getResult());
        Output.success('Success!', false);
        Output.newLine();

    }

    rmi(options){
        let force = false;
        if(options.indexOf('-f') > -1 || options.indexOf('--force') > -1){
            force = true;
        }

        if(options.indexOf('-a') > -1 || options.indexOf('--all') > -1){
            Shell.run('docker', ['image', 'ls', '-a', '-q']);
            options = Shell.getArrayResult();
            if(options.length === 0){
                Output.info('No images found!', false);
                return 0;
            }
        }

        if(force){options.unshift('-f')}

        options.unshift('image', 'rm');

        Shell.run('docker', options);
        Output.writeln(Shell.getResult());
        Output.success('Success!', false);
        Output.newLine();

    }

    runExec(container, options) {

        Shell.exec('docker-compose exec ' + container + ' ' + options.join(' '))

    }

    runSh(container) {

        runCommand('exec ' + container, ['sh']);

    }

    runBash(container) {

        runCommand('exec ' + container, ['bash']);

    }

    runUp(container, options) {

        Shell.exec('docker-compose up ' + options.join(' ') + ' ' + container);

    }

    runPull(container, options) {

        runCommand('pull ' + container, options);

    }

    runStop(container, options) {

        runCommand('stop ' + container, options);

    }

    runStart(container, options) {

        runCommand('start ' + container, options);

    }

    runRm(container, options) {

        runCommand('stop ' + container, options);
        runCommand('rm', options);

    }
}

module.exports = new DockerCommand();