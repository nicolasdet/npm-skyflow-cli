const {Shell, Output} = Skyflow;

class DockerModule {

    // Require
    dispatcher(command) {

        Shell.run("docker", ["info"]);
        if(Shell.hasError()){
            Output.error("Docker does not respond. Check if it is installed and running.", false);
            return 1
        }

        let options = process.argv.slice(3);

        let c = "__docker__" + command;

        if (this[c]) {
            return this[c].apply(this, [options]);
        }

        Output.error("Command " + command + " not found in Docker module.", false);

        return 1
    }

    __docker__ls(options) {

        let what = "container";

        let index = options.indexOf("image");
        if (index > -1) {
            what = "image";
            options[index] = null
        }

        index = options.indexOf("images");
        if (index > -1) {
            what = "image";
            options[index] = null
        }

        index = options.indexOf("container");
        if (index > -1) {
            what = "container";
            options[index] = null
        }

        index = options.indexOf("containers");
        if (index > -1) {
            what = "container";
            options[index] = null
        }

        Shell.exec("docker " + what + " ls " + options.join(" "));

    }

    __docker__rmc(options) {

        if (options.indexOf("-f") < 0 && options.indexOf("--force") < 0) {
            options.push("-f");
        }

        if (options.indexOf("-a") > -1 || options.indexOf("--all") > -1) {
            Shell.run("docker", ["ps", "-a", "-q"]);
            let containers = Shell.getArrayResult();
            if (containers.length === 0) {
                Output.info("No containers found!", false);
                return 0;
            }

            containers.map((container)=>{
                Shell.run("docker", ["rm", "-f", container]);
                Output.success(container + " deleted!", false);
            });

            return 0
        }

        Shell.run("docker", ["rm", ...options]);
        Output.writeln(Shell.getResult());
        Output.success("Success!", false);
    }

    __docker__rmi(options) {

        if (options.indexOf("-f") < 0 && options.indexOf("--force") < 0) {
            options.push("-f");
        }

        if (options.indexOf("-a") > -1 || options.indexOf("--all") > -1) {
            Shell.run("docker", ["images", "-a", "-q"]);
            let images = Shell.getArrayResult();
            if (images.length === 0) {
                Output.info("No images found!", false);
                return 0;
            }

            images.map((image)=>{
                Shell.run("docker", ["rmi", "-f", image]);
                Output.success(image + " deleted!", false);
            });

            return 0
        }

        Shell.run("docker", ["rmi", ...options]);
        Output.writeln(Shell.getResult());
        Output.success("Success!", false);
        Output.newLine();

    }

    __docker__ps(options) {

        Shell.run("docker", ["ps", ...options]);

        if(Shell.hasError()){
            Output.error("Command failed!", false);
        }else {
            Output.writeln(Shell.getResult())
        }

    }

}

module.exports = new DockerModule();