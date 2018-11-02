const resolve = require('path').resolve,
    _ = require('lodash'),
    Helper = Skyflow.Helper,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Shell = Skyflow.Shell,
    Output = Skyflow.Output;

class DefaultCommand {

    version() {

        Output.write(_.upperFirst(Skyflow.Package.name), "green")
            .write(" v" + Skyflow.Package.version, "green")
            .writeln(" (" + Skyflow.Package.license + ")", "green");

        return 0
    }

    help(module = null) {

        let commandsFile = resolve(Helper.getUserHome(), ".skyflow", "doc", "commands.json");

        module = module || 'default';

        if (module) {module = _.lowerFirst(module)}

        function runAfterPull() {

            let commands = require(commandsFile);

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

                if(command.module !== module){
                    return command
                }

                Output.write(command.command, 'green', null, 'bold').space(2);

                // Since
                // if (command[c]['since']) {
                //     Output.writeln(' - since ' + command[c]['since'], 'gray')
                // }

                // Description
                if (command.description) {
                    Output.writeln(command.description)
                }

                // Alias
                if (command.alias) {
                    Output.writeln('Alias:', 'cyan', null, 'underline');
                    Output.writeln(command.alias, 'magenta')
                }

                // Arguments
                const args = command.arguments;
                if (Helper.isArray(args) && !Helper.isEmpty(args)) {
                    Output.writeln('Arguments:', 'cyan', null, 'underline');
                    args.map((arg)=>{
                        Output.write(arg.name, 'magenta').space(2).writeln(arg.description);
                    });
                }

                // Options
                const options = command.options;
                if (Helper.isArray(options) && !Helper.isEmpty(options)) {
                    Output.writeln('Options:', 'cyan', null, 'underline');
                    options.map((option)=>{
                        Output.write(option.name, 'magenta').space(2).writeln(option.description);
                    });
                }

                if(module !== 'default'){
                    Output.newLine()
                }

            });
        }

        if (File.exists(commandsFile)) {
            runAfterPull()
        } else {
            Api.getCommandsDoc(runAfterPull);
        }

        return 0
    }

    alias(){

        let modulesFile = resolve(Helper.getUserHome(), ".skyflow", "doc", "modules.json");

        function runAfterPull() {
            Output.newLine();
            Output.writeln('Alias of modules:', 'blue', null, 'bold');
            Output.writeln('-'.repeat(50), 'blue', null, 'bold');

            const modules = require(modulesFile);

            modules.map((module)=>{
                if(!module.alias){
                    return module
                }
                Output.write(module.alias, null, null, 'bold');
                Output.writeln(' > ' + module.slug);
            });

        }

        if (File.exists(modulesFile)) {
            runAfterPull()
        } else {
            Api.getModulesDoc(runAfterPull);
        }

    }

    modules(){

        let modulesFile = resolve(Helper.getUserHome(), ".skyflow", "doc", "modules.json");

        function runAfterPull() {

            const modules = require(modulesFile);

            Output.newLine();
            Output.writeln("Available modules", "blue", null, "bold");
            Output.writeln("-".repeat(50), "blue", null, "bold");

            Output.newLine();

            modules.map((module) => {

                Output.writeln(module.name, null, null, "bold");
                Output.writeln(module.description + "   [ By " + module.author.name + " ]", "gray");

                // Slug and Alias
                if (module.alias || module.slug) {
                    Output.write("Usage name:", null, null, "underline").space(4);
                    Output.writeln(module.slug + " | " + (module.alias || ""), "magenta");
                }

                Output.newLine();

            });

        }

        if (File.exists(modulesFile)) {
            runAfterPull()
        } else {
            Api.getModulesDoc(runAfterPull);
        }

    }

    invalidate(){

        Shell.rm('-rf', resolve(Helper.getUserHome(), '.skyflow'));

        Output.success('Skyflow cache has been successfully removed.');

    }

}

module.exports = new DefaultCommand();