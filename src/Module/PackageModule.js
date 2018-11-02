const resolve = require("path").resolve,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Shell = Skyflow.Shell,
    Helper = Skyflow.Helper,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    ComposeModule = require("./ComposeModule");

function getPackage(pkg, version = null) {

    let pkgDir = resolve(Skyflow.Helper.getUserHome(), ".skyflow", "api", "package", pkg, version);

    if (!Directory.exists(pkgDir)) {
        return 1
    }

    function runAfterPull(compose, version) {

        try {
            Shell.exec("skyflow compose:add " + compose + " -v " + version + " -f")
        }catch (e) {
            process.exit(1)
        }

        if (Directory.exists(resolve(pkgDir, "composes"))) {
            Directory.copy(resolve(pkgDir, "composes"), resolve(Skyflow.getCurrentDockerDir()))
        }

    }

    if (File.exists(resolve(pkgDir, pkg + ".yml"))) {

        let pkgContent = File.read(resolve(pkgDir, pkg + ".yml"));

        pkgContent.replace(/{% ?([a-z0-9_\-]+(:?\:[a-z0-9\.]+)?) ?%}/g, (m, compose) => {

            compose = compose.split(':');

            if (!compose[1]) {
                compose[1] = "latest";
            }

            let version = compose[1];
            compose = compose[0];

            let composeDir = resolve(Skyflow.Helper.getUserHome(), ".skyflow", "api", "compose", compose, version);

            if(Directory.exists(composeDir)){
                runAfterPull(compose, version)
            }else {
                Api.getDockerComposeOrPackage("compose", compose, () => {
                    runAfterPull(compose, version)
                });
            }

        });

    }

    return 0
}

function listPackage() {

    const packagesDoc = require(resolve(Helper.getUserHome(), ".skyflow", "doc", "packages.json"));

    Output.newLine();
    Output.writeln("Available packages", "blue", null, "bold");
    Output.writeln("-".repeat(50), "blue", null, "bold");

    packagesDoc.map((packageDoc) => {

        Output.write(packageDoc.name, null, null, "bold");
        Output.writeln(" >>> package:add " + packageDoc.slug);

        Output.writeln(packageDoc.description + "   [ By " + packageDoc.author.name + " ]", "gray")

    });

    return 0
}

class PackageModule {

    // Require
    dispatcher(container, command) {

        Shell.run('docker', ['info']);
        if (Shell.hasError()) {
            Output.error('Docker does not respond. Check if it is installed and running.', false);
            return 1
        }

        Shell.run('docker-compose', ['-v']);
        if (Shell.hasError()) {
            Output.error('Docker-compose does not respond. Check if it is installed and running.', false);
            return 1
        }

        if (command === undefined) {
            command = container;
            container = null
        }

        let options = process.argv.slice(3);

        if (container === null) {

            let c = "__package__" + command;

            if (this[c]) {
                return this[c].apply(this, [options]);
            }

        } else {

            let c = "__" + command;

            if (this[c]) {
                return this[c].apply(this, [container, options]);
            }

        }

        Output.error('Command ' + command + ' not found in Package module.', false);

        return 1
    }

    package() {

        if (Request.hasOption("list")) {

            const packagesDoc = resolve(Helper.getUserHome(), ".skyflow", "doc", "packages.json");

            if (File.exists(packagesDoc)) {
                listPackage()
            } else {
                Api.getDockerComposeOrPackageDoc("package", listPackage);
            }

            return 0;
        }

        return 1
    }

    __package__add(packages) {
        
        if (!packages[0]) {
            Output.error("Missing argument.", false);
            process.exit(1)
        }

        let pkg = packages[0],
            packageDir = resolve(Helper.getUserHome(), ".skyflow", "api", "package", pkg);

        let version = null;

        if (Request.hasOption("v")) {
            version = Request.getOption("v");
            packageDir = resolve(packageDir, version);
        }

        function runAfterPull() {

            if (version) {
                return getPackage(pkg, version)
            }

            let versions = Directory.read(packageDir, {directory: true, file: false});

            // Choices
            Input.choices(
                {
                    message: "Choose " + pkg + " package version",
                },
                versions,
                answer => {
                    getPackage(pkg, answer.response)
                }
            );

        }

        if (Directory.exists(packageDir)) {
            runAfterPull()
        } else {
            Api.getDockerComposeOrPackage("package", pkg, runAfterPull);
        }

        return 0
    }

    __package__update() {

        return ComposeModule["__compose__update"].apply(ComposeModule);

    }

    __package__up(options) {

        return ComposeModule["__compose__up"].apply(ComposeModule, [options]);

    }

    __package__down(options) {

        return ComposeModule["__compose__down"].apply(ComposeModule, [options]);

    }

    __package__invalidate() {

        let pkg = "package";
        let packageDir = resolve(Helper.getUserHome(), ".skyflow", "api");

        if (Request.hasOption("package")) {
            pkg += ":" + Request.getOption("package");
            packageDir = resolve(packageDir, ...(pkg.split(":")))
        }

        Directory.remove(packageDir);

        Output.success(pkg + " cache has been successfully removed.");
    }

}

module.exports = new PackageModule();