'use strict';

const fs = require("fs"),
    path = require("path"),
    resolve = require("path").resolve,
    Directory = Skyflow.Directory,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require('lodash');

function listScript() {

    let scriptListFileName = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script', 'script.list.js');

    function displayStyleList() {

        let scripts = require(scriptListFileName);

        Output.newLine();
        Output.writeln('Available scripts', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        scripts.map((script)=>{

            Output.write(script, null, null, 'bold');
            Output.writeln(' >>> script:add ' + script);

        });

    }

    if (!File.exists(scriptListFileName)) {

        Output.writeln('Pulling scripts list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('scripts', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull scripts list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                scripts = [];

            Directory.create(resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script'));

            data.map((d)=>{
                scripts.push(d.filename.replace(/\.js/g, ''));
            });

            File.create(scriptListFileName, "'use strict';\n\nmodule.exports = "+JSON.stringify(scripts));
            if (Skyflow.Helper.isInux()) {fs.chmodSync(scriptListFileName, '777')}

            displayStyleList()

        });

        return 0
    }

    displayStyleList();

    return 0
}

class ScriptModule {

    // Require
    dispatcher() {

        let method = '__script__' + Object.values(arguments).join('__'),
            args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in Script module.', false);

        return 1
    }

    script(){

        if(Request.hasOption("list")){
            return listScript();
        }

        return 1
    }

    __script__add(scripts) {

        if (!scripts[0]) {
            Output.error('Invalid script name.', false);
            process.exit(1);
        }

        let scriptDir = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script');

        function runAfterPull(name) {

            name = _.upperFirst(name);

            if(!File.exists(resolve(scriptDir, name + '.js'))){
                Output.error(name + ' script not found.', false);
                return 1
            }

            let dir = '';
            if(Request.hasOption('dir')){
                dir = Request.getOption('dir')
            }

            let tmpDir = dir;
            dir = resolve(process.cwd(), dir);
            Directory.create(dir);

            name += '.js';

            if(File.exists(resolve(dir, name))){
                Output.info(_.trim(tmpDir + path.sep + name, '/') + ' already exists.', false);
                return 1
            }

            File.copy(resolve(scriptDir, name), resolve(dir, name));
            if (Skyflow.Helper.isInux()) {fs.chmodSync(resolve(dir, name), '777')}

            Output.success(name);
        }

        scripts.map((name)=>{

            if (File.exists(resolve(scriptDir, name + '.js'))) {
                runAfterPull(name)
            } else {
                Api.getScriptByName(name, runAfterPull);
            }

        });

        return 0
    }

}

module.exports = new ScriptModule();