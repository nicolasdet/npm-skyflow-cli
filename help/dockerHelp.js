module.exports = {

    'docker:rmi': {
        description: "Remove one or more images.",
        options: {
            '-f, --force': "Force removal of the image.",
            '--no-prune': 'Do not delete untagged parents'
        }

    },
    'docker:rmc [container]': {
        description: "Remove stopped containers.",
        options: {
            '--all , -a': "Remove all containers.",
            '-f, --force': "Force the removal of a running container (uses SIGKILL).",
            '--link , -l': "Remove the specified link.",
            '--volumes , -v': "Remove the volumes associated with the container.",
        }

    },
    'docker:ls [container|image]': {
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
    'docker:ps': {
        description: "Lists containers. See https://docs.docker.com/engine/reference/commandline/ps for more information.",
        options: {
            '--all , -a': 'Show all containers (default shows just running).',
            '--filter , -f': 'Filter output based on conditions provided.',
            '--format': 'Pretty-print containers using a Go template.',
            '--last , -n': 'Show n last created containers (includes all states).',
            '--latest , -l': 'Show the latest created container (includes all states).',
            '--no-trunc': 'Don’t truncate output.',
            '--quiet , -q': 'Only display numeric IDs.',
            '--size , -s': 'Display total file sizes.',
        }
    },

};