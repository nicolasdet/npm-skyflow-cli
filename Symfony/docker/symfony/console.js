'use strict';

const resolve = require('path').resolve;

let ENV = "dev",
    SERVER_NAME = "dev.myapp.com";

function getConfigFiles(host = "http") {

    let File = Skyflow.File;
    let Directory = Skyflow.Directory;
    let confDir = resolve(Skyflow.getCurrentDockerDir(), 'symfony', 'conf');

    File.copy(resolve(confDir, host, 'Dockerfile.' + ENV), resolve(confDir, '..', 'Dockerfile.dist'));
    File.copy(resolve(confDir, host, 'symfony.' + ENV + '.yml'), resolve(confDir, '..', 'docker-compose.dist'));
    File.copy(resolve(confDir, host, 'httpd.' + ENV + '.conf'), resolve(confDir, 'apache2', 'httpd.conf'));

    if (ENV === 'prod' && host === 'https') {

        Directory.create(resolve(confDir, 'letsencrypt'));
        Directory.create(resolve(confDir, 'letsencrypt-lib'));

        let certDir = resolve(confDir, 'letsencrypt');
        let libDir = resolve(confDir, 'letsencrypt-lib');

        let command = "run -it --rm --name certbot -v '" + certDir + ":/etc/letsencrypt' -v '" + libDir + ":/var/lib/letsencrypt' certbot/certbot certonly";

        Skyflow.Output.newLine();

        Skyflow.Output.info("Generating key ...", false);

        Skyflow.Shell.exec("docker " + command)

    }

}

// symfony

module.exports = {

    questions: [
        {
            message: "Application name",
            name: "application_name",
            default: "symfony_app",
        },
        {
            message: "Your server host name",
            name: "server_name",
            default: SERVER_NAME,
            validator: (value) => {
                SERVER_NAME = value;
                return true
            }
        },
        {
            message: "Administrator e-amil",
            name: "server_admin",
            default: "admin@myapp.com",
        },
        {
            message: "Application port",
            name: "port",
            default: "80",
            validator: (value) => {
                if (Skyflow.isPortReachable(value)) {
                    return 'This port is not available.'
                }
                Skyflow.addDockerPort(value);
                return true
            }
        },
        {
            message: "Environment. Set 'dev' or 'prod'",
            name: "env",
            default: ENV,
            validator: (value) => {
                if (value !== 'dev' && value !== 'prod') {
                    return 'Your environment is not valid. Use dev or prod.'
                }
                ENV = value;
                return true
            }
        },
        {
            message: "Secure with HTTPS?. Set 'yes' or 'no'",
            name: "https",
            default: "no",
            validator: (value) => {
                if (value !== 'no' && value !== 'yes') {
                    return 'Make your choice.'
                }

                getConfigFiles((value === 'yes') ? 'https' : 'http');

                return true
            }
        }
    ],

    messages: {
        writeln: [
            '-> For production, see {{ server_name }}:{{ port }}',
            '-> For development, see localhost:{{ port }}',
        ],
    }

};
