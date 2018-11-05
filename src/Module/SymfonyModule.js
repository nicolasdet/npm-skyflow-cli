const {Shell, Output, File} = Skyflow;

function execSymfonyCommand(command, args = []) {
    try {
        command = command + " " + args.join(" ");
        Output.newLine();
        Output.write("Running ");
        Output.write(command, "green");
        Output.writeln(" command ...");
        Output.newLine();
        Shell.exec("skyflow compose:symfony:exec \"php bin/console " + command + "\"")
    }catch (e) {
        Output.error(e.message);
        process.exit(1)
    }
}

class SymfonyModule {

    // Require
    dispatcher() {

        Shell.run("docker", ["info"]);
        if (Shell.hasError()) {
            Output.error("Docker does not respond. Check if it is installed and running.", false);
            process.exit(1)
        }
        
        let method = "__symfony__" + Object.values(arguments).join("__"),
            args = process.argv.slice(3);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error("Command not found in Symfony module.", false);

        process.exit(1)
    }

    __symfony__api__install() {

        Output.newLine();
        Output.write("Installing ");
        Output.write("Symfony API Skeleton", "green");
        Output.writeln(" command ...");
        Output.newLine();

        try {
            Shell.exec("docker run --rm --volume " + process.cwd() + ":/app composer create-project symfony/skeleton .");
            Shell.exec("skyflow package:add symfony -v latest");
            Shell.exec("skyflow package:update");

            let content = File.read(".gitignore");
            content += "\ndocker/docker-compose.yml";
            content += "\ndocker/symfony/symfony.values.js";
            content += "\ndocker/symfony/Dockerfile";
            content += "\ndocker/symfony/conf/apache2/httpd.conf";
            content += "\ndocker/composer/composer.values.js";
            content += "\ndocker/mariadb/mariadb.values.js";
            File.create(".gitignore", content)

        }catch (e) {
            Output.error(e.message, false);
            process.exit(1)
        }

    }

    __symfony__install() {

        Output.newLine();
        Output.write("Installing ");
        Output.write("Symfony Website Skeleton", "green");
        Output.writeln(" command ...");
        Output.newLine();

        try {
            Shell.exec("docker run --rm --volume " + process.cwd() + ":/app composer create-project symfony/website-skeleton .");
            Shell.exec("skyflow package:add symfony -v latest");
            Shell.exec("skyflow package:update");

            let content = File.read(".gitignore");
            content += "\ndocker/docker-compose.yml";
            content += "\ndocker/symfony/symfony.values.js";
            content += "\ndocker/symfony/Dockerfile";
            content += "\ndocker/symfony/conf/apache2/httpd.conf";
            content += "\ndocker/composer/composer.values.js";
            content += "\ndocker/mariadb/mariadb.values.js";
            File.create(".gitignore", content)

        }catch (e) {
            Output.error(e.message, false);
            process.exit(1)
        }

    }

    __symfony__exec(args) {
        execSymfonyCommand(args.join(" "))
    }

    __symfony__about() {
        execSymfonyCommand("about")
    }

    __symfony__help() {
        execSymfonyCommand("help")
    }

    __symfony__commands() {
        execSymfonyCommand("list")
    }

    __symfony__list() {
        execSymfonyCommand("list")
    }

    __symfony__cache__clear(args) {
        execSymfonyCommand("cache:clear", args)
    }

    __symfony__cache__warmup(args) {
        execSymfonyCommand("cache:warmup", args)
    }

    __symfony__debug__autowiring(args) {
        execSymfonyCommand("debug:autowiring", args)
    }

    __symfony__debug__config(args) {
        execSymfonyCommand("debug:config", args)
    }

    __symfony__debug__container(args) {
        execSymfonyCommand("debug:container", args)
    }

    __symfony__debug__router(args) {
        execSymfonyCommand("debug:router", args)
    }

    __symfony__db__create(args) {
        execSymfonyCommand("doctrine:database:create", args)
    }

    __symfony__db__drop(args) {
        execSymfonyCommand("doctrine:database:drop", args)
    }

    __symfony__migrations__diff(args) {
        execSymfonyCommand("doctrine:migrations:diff", args)
    }

    __symfony__migrations__execute(args) {
        execSymfonyCommand("doctrine:migrations:execute", args)
    }

    __symfony__migrations__generate(args) {
        execSymfonyCommand("doctrine:migrations:generate", args)
    }

    __symfony__migrations__migrate(args) {
        execSymfonyCommand("doctrine:migrations:migrate", args)
    }

    __symfony__migrations__status(args) {
        execSymfonyCommand("doctrine:migrations:status", args)
    }

    __symfony__fixtures__load(args) {
        execSymfonyCommand("doctrine:fixtures:load", args)
    }

    __symfony__migrations__version(args) {
        execSymfonyCommand("doctrine:migrations:version", args)
    }

    __symfony__schema__create(args) {
        execSymfonyCommand("doctrine:schema:create", args)
    }

    __symfony__schema__drop(args) {
        execSymfonyCommand("doctrine:schema:drop", args)
    }

    __symfony__schema__update(args) {
        execSymfonyCommand("doctrine:schema:update", args)
    }

    __symfony__schema__validate(args) {
        execSymfonyCommand("doctrine:schema:validate", args)
    }

    __symfony__make__auth(args) {
        execSymfonyCommand("make:auth", args)
    }

    __symfony__make__command(args) {
        execSymfonyCommand("make:command", args)
    }

    __symfony__make__controller(args) {
        execSymfonyCommand("make:controller", args)
    }

    __symfony__make__crud(args) {
        execSymfonyCommand("make:crud", args)
    }

    __symfony__make__entity(args) {
        execSymfonyCommand("make:entity", args)
    }

    __symfony__make_fixtures(args) {
        execSymfonyCommand("make:fixtures", args)
    }

    __symfony__make__form(args) {
        execSymfonyCommand("make:form", args)
    }

    __symfony__make__migration(args) {
        execSymfonyCommand("make:migration", args)
    }

    __symfony__make__subscriber(args) {
        execSymfonyCommand("make:subscriber", args)
    }

    __symfony__make__user(args) {
        execSymfonyCommand("make:user", args)
    }

    __symfony__make__validator(args) {
        execSymfonyCommand("make:validator", args)
    }

    __symfony__make__voter(args) {
        execSymfonyCommand("make:voter", args)
    }

    __symfony__router__match(args) {
        execSymfonyCommand("router:match", args)
    }

    __symfony__translation__update(args) {
        execSymfonyCommand("translation:update", args)
    }

    __symfony__sh() {
        Shell.exec("skyflow compose:symfony:sh");
    }

    __symfony__composer__install() {
        Shell.exec("skyflow compose:composer:rm -f -v");
        Shell.exec("skyflow compose:composer:run \"composer install\"");
    }

    __symfony__composer__update() {
        Shell.exec("skyflow compose:composer:rm -f -v");
        Shell.exec("skyflow compose:composer:run \"composer update\"");
    }

    __symfony__composer__exec() {
        Shell.exec("skyflow compose:composer:rm -f -v");
        Shell.exec("skyflow compose:composer:run \"composer "+(Object.values(arguments).join(" "))+"\"");
    }

    __symfony__require() {
        Shell.exec("skyflow compose:composer:rm -f -v");
        Shell.exec("skyflow compose:composer:run \"composer require "+(Object.values(arguments).join(" "))+"\"");
    }

}

module.exports = new SymfonyModule();
