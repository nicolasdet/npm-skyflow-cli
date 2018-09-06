'use strict';

const resolve = require('path').resolve,
    _ = require('lodash'),
    Helper = Skyflow.Helper,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Output = Skyflow.Output;

class DefaultCommand {

    version() {

        Output.write(_.upperFirst(Skyflow.Package.name), 'green')
            .write(' v' + Skyflow.Package.version, 'green')
            .writeln(' (' + Skyflow.Package.license + ')', 'green');

        return 0
    }

    help(module = null) {

        let helpDir = resolve(Helper.getUserHome(), '.skyflow', 'extra', 'help');

        module = module || 'default';

        if (module) {module = _.lowerFirst(module)}

        let helpFile = resolve(helpDir, module + 'Help.json');

        function runAfterPull() {
            let commands = [
                require(helpFile)
            ];

            let title = _.upperFirst(Skyflow.Package.name) + ' v' + Skyflow.Package.version;

            if(module){title = "Help for " + _.upperFirst(module) + " module"}

            Output.newLine()

            // Display Title
                .writeln(title, 'magenta')
                .writeln('-'.repeat(100), 'magenta', null, 'bold');

            if(module !== 'default'){
                Output.newLine()
            }

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

                    if(module !== 'default'){
                        Output.newLine()
                    }

                }

            });
        }

        if (File.exists(helpFile)) {
            runAfterPull()
        } else {
            Api.getModuleHelp(module, runAfterPull);
        }

        return 0
    }

    alias(alias){

        Output.newLine();
        Output.writeln('Alias of modules:', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        for(let a in alias){
            if(!alias.hasOwnProperty(a)){
                continue
            }
            Output.write(a, null, null, 'bold');
            Output.writeln(' > ' + alias[a]);
        }

    }

    invalidate(){

        Helper.getUserHome()

    }

    modules(){

    }

}

module.exports = new DefaultCommand();