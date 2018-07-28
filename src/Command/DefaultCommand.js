'use strict';

const fs = require('fs'), resolve = require('path').resolve;

const File = Skyflow.File,
    Directory = Skyflow.Directory,
    Package = Skyflow.Package,
    Helper = Skyflow.Helper,
    Output = Skyflow.Output;

class DefaultCommand {

    version() {

        Output.write(Package.name, 'green')
            .write(' v' + Package.version, 'green')
            .writeln(' (' + Package.license + ')', 'green');

        return 0
    }

    help(module = null) {

        let file = "default";

        if (module) {file = Skyflow.Helper.lowerFirst(module)}

        let commands = [
            require(resolve(__dirname, '..', '..', 'help', file + 'Help'))
        ];

        let title = Package.name.toUpperCase() + ' v' + Package.version;

        if(module){title = "Help for " + Skyflow.Helper.upperFirst(module) + " module"}

        Output.newLine()

        // Display Title
            .writeln(title, 'magenta')
            .writeln('-'.repeat(100), 'magenta', null, 'bold')
            .newLine();

        commands.forEach((command) => {

            for (let c in command) {

                Output.write(c, 'green', null, 'bold').space(2);

                // Since
                if (command[c]['since']) {
                    Output.writeln(' - since ' + command[c]['since'], 'gray')
                }

                // Description
                if (command[c]['description']) {
                    Output.writeln(command[c]['description'])
                }

                // Options
                const options = command[c]['options'];
                if (Helper.isObject(options) && !Helper.isEmpty(options)) {
                    Output.writeln('Options:', 'cyan', null, 'underline');
                    for (let o in options) {
                        Output.write(o, 'magenta').space(2).writeln(options[o]);
                    }
                }

                Output.newLine()
            }

        });

        return 0
    }

    init(options) {

        if (File.exists(Skyflow.CONFIG_FILE_NAME)) {
            Output.info(Skyflow.CONFIG_FILE_NAME + ' file already exists.', false);
            return 0
        }

        let s = resolve(__dirname, '..', '..', 'resources', Skyflow.CONFIG_FILE_NAME);
        let dest = resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME);
        File.copy(s, dest);
        if (Skyflow.isInux()) {
            fs.chmodSync(dest, '777');
        }
        Output.success(Skyflow.CONFIG_FILE_NAME + ' was successfully created.');
        return 0
    }

    install(options) {

        if (options['list']) {

            Output.newLine();
            Output.writeln('Available modules:', 'blue', null, 'bold');
            Output.writeln('-'.repeat(50), 'blue', null, 'bold');
            // Output.newLine();

            let modulesPath = resolve(__dirname, '..', 'Module');
            let modules = Directory.read(modulesPath);
            modules.map((module) => {

                let name = module.replace(/Module\.js$/, '');
                Output.write(name, null, null, 'bold');
                Output.writeln(' -> skyflow install ' + name.toLowerCase());
                module = require(resolve(modulesPath, module));
                if (Helper.isFunction(module['getDescription'])) {
                    Output.writeln(module.getDescription(), 'gray')
                }
            });

            return 0
        }

        let moduleName = Object.keys(Skyflow.Request.getCommands())[1];

        if (!moduleName) {
            Output.error('Can not install empty module.', false);
            return 1
        }

        moduleName = Helper.upperFirst(moduleName);
        let modulePath = resolve(__dirname, '..', 'Module', moduleName + 'Module.js');

        if (!File.exists(modulePath)) {
            Output.error('Module ' + moduleName + ' not found.', false);
            return 1
        }

        let module = require(modulePath);

        if (!Helper.isFunction(module['install'])) {
            Output.error('Install method not found in ' + moduleName + ' module.', false);
            return 1
        }

        module['install'].apply(null, [options]);

    }

    shell(options) {

        if (options['exit'] || options['e']) {
            let currentShell = resolve(__dirname, '..', 'Shell', '.current');
            File.create(currentShell);
            Output.success("Exit shell mode");
            return 1
        }

        if (options['list'] || options['l']) {

            Output.newLine();
            Output.writeln('Available shell:', 'blue', null, 'bold');
            Output.writeln('-'.repeat(50), 'blue', null, 'bold');
            // Output.newLine();

            let shellsPath = resolve(__dirname, '..', 'Shell');
            let shells = Directory.read(shellsPath, {directory: false, file: true, filter: /Shell\.js$/});

            shells.map((shell) => {

                let name = shell.replace(/Shell\.js$/, '');
                Output.write(name, null, null, 'bold');
                Output.writeln(' -> skyflow shell ' + name.toLowerCase());
                shell = require(resolve(shellsPath, shell));
                if (Helper.isFunction(shell['getDescription'])) {
                    Output.writeln(shell.getDescription(), 'gray')
                }

            });

            return 0
        }

        let shellName = Object.keys(Skyflow.Request.getCommands())[1];

        let currentShell = resolve(__dirname, '..', 'Shell', '.current');

        if (!shellName) {
            currentShell = File.read(currentShell).replace(/\.js$/, '');
            Output.success("*" + currentShell, false);
            return 1
        }


        shellName = Helper.upperFirst(shellName);
        let shellPath = resolve(__dirname, '..', 'Shell', shellName + 'Shell.js');

        if (!File.exists(shellPath)) {
            Output.error('Shell ' + shellName + ' not found.', false);
            return 1
        }

        let shell = require(shellPath);

        if (!Helper.isFunction(shell['run'])) {
            Output.error('Run method not found in ' + shellName + ' shell.', false);
            return 1
        }

        File.create(currentShell, shellName + 'Shell.js');

        Output.success("You are using " + shellName + " shell");

    }

}

module.exports = new DefaultCommand();