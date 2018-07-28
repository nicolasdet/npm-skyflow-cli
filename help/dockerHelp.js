module.exports = {

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
    ps: {
        description: "Lists containers.",
        options: {
            '-q': "Only display IDs",
        }
    },

};