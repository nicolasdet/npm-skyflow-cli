module.exports = {

    build: {
        description: "Services are built once and then tagged, by default as project_service.",
        options: {
            '--compress': 'Compress the build context using gzip.',
            '--force-rm': 'Always remove intermediate containers.',
            '--no-cache': 'Do not use cache when building the image.',
            '--pull': 'Always attempt to pull a newer version of the image.',
            '-m, --memory MEM': 'Sets memory limit for the build container.',
            '--build-arg key=val': 'Set build-time variables for services.',
        }
    },
    config: {
        description: "Validate and view the Compose file.",
        options: {
            '--resolve-image-digests': "Pin image tags to digests.",
            '-q, --quiet': "Only validate the configuration, don't print.",
            '--services': "Print the service names, one per line.",
            '--volumes': "Print the volume names, one per line.",
        }
    },
    services: {
        description: "Print the current service names, one per line.",
    },
    volumes: {
        description: "Print the current volume names, one per line.",
    },
    down: {
        description: "Stops containers and removes containers, networks, volumes, and images created by up.",
        options: {
            '--rmi [all|local]': "Remove images. Type must be one of: \n" +
            "                   'all': Remove all images used by any service. \n" +
            "                   'local': Remove only images that don't have a custom tag set by the 'image' field.",
            '-v, --volumes': "Remove named volumes declared in the 'volumes' section of the Compose file \n and anonymous volumes attached to containers.",
            '--remove-orphans': "Remove containers for services not defined in the \n Compose file.",
            '-t, --timeout [TIMEOUT]': "Specify a shutdown timeout in seconds (default: 10)."
        }
    },
    kill: {
        description: "Forces running containers to stop by sending a SIGKILL signal.",
        options: {
            '-s SIGNAL': "SIGNAL to send to the container. Default signal is SIGKILL.",
        }
    },
    logs: {
        description: "Displays log output from services.",
        options: {
            '--no-color': "Produce monochrome output.",
            '-f, --follow': "Follow log output.",
            '-t, --timestamps': "Show timestamps.",
            "--tail='all'": "Number of lines to show from the end of the logs for each container."
        }
    },
    port: {
        description: "Prints the public port for a port binding.",
        options: {
            '--protocol=proto': "tcp or udp [default: tcp]",
            '--index=index': "index of the container if there are multiple instances of a service [default: 1]",
        }
    },
    ps: {
        description: "Lists containers.",
        options: {
            '-q': "Only display IDs",
        }
    },
    restart: {
        description: "Restarts all stopped and running services.",
        options: {
            '-t, --timeout TIMEOUT': "Specify a shutdown timeout in seconds. (default: 10)",
        }
    },
    rm: {
        description: "Removes stopped service containers.",
        options: {
            '-f, --force': "Don't ask to confirm removal.",
            '-s, --stop': "Stop the containers, if required, before removing.",
            '-v': "Remove any anonymous volumes attached to containers.",
        }
    },
    rmi: {
        description: "Remove one or more images.",
        options: {
            '-f, --force': "Force removal of the image.",
            '--no-prune': 'Do not delete untagged parents'
        }

    },
    rmc: {
        description: "Remove stopped containers.",
        options: {
            '--all , -a': "Remove all containers.",
            '-f, --force': "Force the removal of a running container (uses SIGKILL).",
            '--link , -l': "Remove the specified link.",
            '--volumes , -v': "Remove the volumes associated with the container.",
        }

    },
    up: {
        description: "Builds, (re)creates, starts, and attaches to containers for a service.",
        options: {
            '-d, --detach': "Detached mode: Run containers in the background, print new container names.",
            '--build': "Build images before starting containers.",
        }
    },
    'ls [container|image]': {
        description: "List images and containers.",
        options: {
            '--all , -a': "Show all images or containers (default hides intermediate images or just running containers).",
            '--digests': "Show digests.",
            '--filter , -f': "Filter output based on conditions provided.",
            '--format': "Pretty-print images using a Go template.",
            '--no-trunc': "Don’t truncate output.",
            '--quiet , -q': "Only show numeric IDs",
        }

    },
    '<service>:up': {
        description: "Builds, (re)creates, starts, and attaches to containers for a service.",
        options: {
            '-d, --detach': "Detached mode: Run containers in the background, print new container names.",
            '--build': "Build images before starting containers.",
        }
    },
    '<container|service>:exec': {
        description: "Run arbitrary commands in your services.",
        options: {
            '-d, --detach': "Detached mode: Run command in the background.",
            '--privileged': "Give extended privileges to the process.",
            '-u, --user USER': "Run the command as this user.",
            '--index=index': "index of the container if there are multiple \n instances of a service [default: 1]",
            '-e, --env KEY=VAL': "Set environment variables (can be used multiple times, \n not supported in API < 1.25)",
            '-w, --workdir DIR': "Path to workdir directory for this command.",
        }
    },
    '<container>:sh': {
        description: "Get an alpine interactive prompt.",
    },
    '<container>:bash': {
        description: "Get an bash interactive prompt.",
    },
    '<service>:pull': {
        description: "Pulls an image associated with a service defined in a docker-compose.yml \n " +
        "or docker-stack.yml file, but does not start containers based on those images.",
        options: {
            '--ignore-pull-failures': "Pull what it can and ignores images with pull failures.",
            '--no-parallel': "Disable parallel pulling.",
            '-q, --quiet': "Pull without printing progress information.",
            '--include-deps': "Also pull services declared as dependencies.",
        }
    },
    '<container>:rm': {
        description: "Stops and removes containers.",
        options: {
            '-f, --force': "Don't ask to confirm removal.",
            '-s, --stop': "Stop the containers, if required, before removing.",
            '-v': "Remove any anonymous volumes attached to containers.",
        }
    },
    '<container>:start': {
        description: "Starts existing containers for a service.",
    },
    '<container>:stop': {
        description: "Stops running containers without removing them. They can be started again.",
        options: {
            '-t, --timeout TIMEOUT': "Specify a shutdown timeout in seconds (default: 10).",
        }
    },





    'compose:add': {
        description: "Add new compose into docker-compose.yml.",
    },
    'compose:rm': {
        description: "Remove compose from docker-compose.yml.",
        options: {
            '--dir': 'Remove local directory.'
        }
    },
    'compose:update': {
        description: "Update docker-compose.yml using local files.",
    },
    'compose:list': {
        description: "List compose can be added.",
    },

};