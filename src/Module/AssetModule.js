const path = require("path"),
    resolve = path.resolve,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    Shell = Skyflow.Shell,
    Helper = Skyflow.Helper,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require("lodash");

function runInfo() {

    Output.newLine();
    Output.writeln("Run:", false, false, "bold");
    Output.newLine();
    Output.success("skyflow asset:compile", false);
    Output.writeln("Compile assets for development environment.");
    Output.newLine();
    Output.success("skyflow asset:build", false);
    Output.writeln("Compile assets for production environment.");
    Output.newLine();
    Output.success("skyflow asset:watch", false);
    Output.writeln("For watching assets.");
    Output.newLine();

}

class AssetModule {

    // Require
    dispatcher() {

        let method = "__asset__" + Object.values(arguments).join("__");

        let args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error("Command not found in Asset module.", false);

        return 1
    }

    __asset__install() {
        let assetDir = resolve(Helper.getUserHome(), ".skyflow", "api", "asset", "base");

        function runAfterPull() {

            let currentAssetDir = Skyflow.getCurrentAssetDir();

            Directory.copy(assetDir, resolve(currentAssetDir));

            try{
                Shell.exec("skyflow compose:add asset -v latest" + (Request.hasOption("f") ? " -f" : ""));
            }catch (e) {
                Output.error(e.message, false)
            }
        }

        if (Directory.exists(assetDir)) {
            runAfterPull()
        } else {
            Api.getAssetsFiles("base", runAfterPull);
        }

        return 0
    }

    __asset__react__install() {
        let assetDir = resolve(Helper.getUserHome(), ".skyflow", "api", "asset", "react");

        function runAfterPull() {

            let currentAssetDir = Skyflow.getCurrentAssetDir();

            Directory.copy(assetDir, resolve(currentAssetDir));

            try{
                Shell.exec("skyflow compose:add asset -v latest" + (Request.hasOption("f") ? " -f" : ""));
            }catch (e) {
                Output.error(e.message, false)
            }
        }

        if (Directory.exists(assetDir)) {
            runAfterPull()
        } else {
            Api.getAssetsFiles("react", runAfterPull);
        }

        return 0
    }

    __asset__update() {
        Shell.exec("skyflow compose:update asset");

        // Update dependencies
        Shell.exec("skyflow compose:asset:run \"yarn\"");

        runInfo();
    }

    __asset__compile() {
        Shell.exec("skyflow compose:asset:run \"yarn run compile\"");
    }

    __asset__build() {
        Shell.exec("skyflow compose:asset:run \"yarn run build\"");
    }

    __asset__watch() {
        Shell.exec("skyflow compose:asset:run \"yarn run watch\"");
    }

    __asset__sh() {
        Shell.exec("skyflow compose:asset:run \"sh\"");
    }

    __asset__run() {
        Shell.exec("skyflow compose:asset:run \""+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__add() {
        Shell.exec("skyflow compose:asset:run \"yarn add "+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__remove() {
        Shell.exec("skyflow compose:asset:run \"yarn remove "+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__invalidate() {
        Shell.rm('-rf', resolve(Helper.getUserHome(), ".skyflow", "api", "asset"));
        Output.success('Asset cache has been successfully removed.');
    }

}

module.exports = new AssetModule();
