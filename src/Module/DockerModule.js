'use strict';

const Shell = Skyflow.Shell,
    Output = Skyflow.Output;


class DockerModule {

    // Require
    dispatcher(command) {

        Shell.run('docker', ['-v']);
        if(Shell.hasError()){
            Output.error('Docker does not respond. Check if it is installed and running.', false);
            return 1
        }

        let options = process.argv.slice(3);

        let c = "__docker__" + command;

        if (this[c]) {
            return this[c].apply(this, [options]);
        }

        Output.error('Command ' + command + ' not found in Docker module.', false);

        return 1
    }

    __docker__ls(options) {

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

    __docker__rmc(options) {

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

    __docker__rmi(options) {
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

    __docker__ps(options) {
        Shell.exec('docker ps ' + options.join(' '));
    }

}

module.exports = new DockerModule();