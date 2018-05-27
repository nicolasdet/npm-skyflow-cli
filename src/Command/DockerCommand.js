'use strict';

const fs = require('fs'), resolve = require('path').resolve;

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
        if(Shell.hasError()){
            Output.error("An error occurred while running the command 'docker-compose config --services'")
        }else {
            if(Shell.getArrayResult().length === 0){
                Output.writeln('No volumes!', 'blue')
            }else {
                Output.writeln(Shell.getResult());
            }
        }
    }

    volumes() {
        let options = ['config', '--volumes'];
        Shell.run('docker-compose', options);
        if(Shell.hasError()){
            Output.error("An error occurred while running the command 'docker-compose config --volumes'")
        }else {
            if(Shell.getArrayResult().length === 0){
                Output.writeln('No volumes!', 'blue')
            }else {
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


}

module.exports = new DockerCommand();