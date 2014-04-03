# Overcast

![Screenshot](http://i.imgur.com/n8IKY6m.png)

Overcast is a simple terminal-based cloud management tool that was designed to make it easy to spin up and manage clusters of servers in a consistent, scriptable way. Inspired by [Packer.io](http://packer.io).

## Concepts

1. **Instances** are any machine you can SSH into. Instances can be local or remote, virtual or physical. Each instance has a name, IP, SSH key and port.
2. **Clusters** are sets of instances.

## Features

- Define clusters and instances using the command line or by editing a simple JSON file.

  ```sh
  $ overcast cluster create db
  $ overcast cluster create app
  $ overcast instance import app.01 --cluster=app --ip=127.0.0.2 \
    --ssh-port=22222 --ssh-key=$HOME/.ssh/id_rsa
  $ overcast instance import app.02 --cluster=app --ip=127.0.0.3 \
    --ssh-port=22222 --ssh-key=$HOME/.ssh/id_rsa
  ```

- Create, snapshot and destroy instances on DigitalOcean (EC2/Linode support is on the roadmap).

  ```sh
  # Create a new Ubuntu 12.04 instance:
  $ overcast instance create db.01 --cluster=db
  # Configure the instance to your liking:
  $ overcast run db.01 install/core install/redis
  $ overcast expose db.01 22 6379
  # Create a snapshot:
  $ overcast digitalocean snapshot db.01 my.db.snapshot
  # Spin up a cluster using your snapshot:
  $ overcast instance create db.02 --cluster=db --image-name=my.db.snapshot
  $ overcast instance create db.03 --cluster=db --image-name=my.db.snapshot
  $ overcast instance create db.04 --cluster=db --image-name=my.db.snapshot
  ```

- Run commands or script files across any number of servers. Commands can be run sequentially or in parallel.

  ```sh
  $ overcast run db install/core install/redis
  $ overcast run all uptime "free-m" "df -h" --parallel
  ```

- Push and pull files between your local machine and an instance, a cluster, or all clusters. Dynamically rewrite file paths to include the instance name.

  ```sh
  $ overcast push app nginx/myapp.conf /etc/nginx/sites-enabled/myapp.conf
  $ overcast pull all /etc/nginx/sites-enabled/myapp.conf nginx/{instance}.myapp.conf
  ```

- Overcast is a thin wrapper around your native SSH client, and doesn't install or leave anything on the servers you communicate with.

- A [script library](https://github.com/andrewchilds/overcast/tree/master/.overcast/scripts) is included to make it easy to install common software components. The library was written for Ubuntu servers, but could be extended to include other distributions.

## Design Goals &amp; Motivation

There are a number of server management frameworks out there already (Chef, Puppet, Ansible, Salt), but they all involve either a complicated server/client implementation, a steep learning curve or a giant, monolithic conceptual framework.

I wanted something that was conceptually simple and focused on the problem of multi-server provisioning and communication, that leaves problems like process management and system monitoring to tools designed specifically for those problems (Monit, Munin, Nagios).

## Installation

1. Install [Node.js](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) if not already installed.

2. Install Overcast using npm.

    ```sh
    $ npm -g install overcast
    ```

3. You can now use Overcast from any directory.

    ```sh
    $ overcast help
    ```

## Configuration

Overcast looks for an `.overcast` directory in the current directory, or in some parent directory, otherwise falling back to `$HOME/.overcast`. This allows you to have multiple configurations, and to check your cluster definitions and scripts into a repo, like source code.

The command `overcast init` will create a new configuration in the current directory. The config directory looks like this:

```sh
.overcast
  /files            # Files to be copied to instances
  /keys             # SSH keys. Can be your own or auto-generated by overcast
  /scripts          # Scripts to be run on instances
  /clusters.json    # Cluster/instance definitions (see example.clusters.json)
  /variables.json   # API keys, etc (see example.variables.json)
```

## API Documentation

### overcast cluster

```
  overcast cluster create [name]
    Creates a new cluster.

    Example:
    $ overcast cluster create db

  overcast cluster rename [name] [new-name]
    Renames a cluster.

    Example:
    $ overcast cluster rename app-cluster app-cluster-old

  overcast cluster remove [name]
    Removes a cluster from the index. If the cluster has any instances
    attached to it, they will be moved to the "orphaned" cluster.

    Example:
    $ overcast cluster remove db
```

### overcast completions

```
  overcast completions
    Return an array of commands, cluster names, and instance names for use
    in bash tab completion.

    To enable tab completion in bash, add this to your .bash_profile:

    _overcast_completions() {
      local cur=${COMP_WORDS[COMP_CWORD]}
      COMPREPLY=($(compgen -W "`overcast completions`" -- "$cur"))
      return 0
    }
    complete -F _overcast_completions overcast
```

### overcast digitalocean

```
  These functions require the following values set in .overcast/variables.json:
    DIGITALOCEAN_CLIENT_ID
    DIGITALOCEAN_API_KEY

  overcast digitalocean create [name] [options]
    Creates a new instance on DigitalOcean.

    The instance will start out using the auto-generated SSH key found here:
    /path/to/.overcast/keys/overcast.key.pub

    You can specify region, image, and size of the droplet using -id or -slug.
    You can also specify an image or snapshot using --image-name.

      Option               | Default
      --cluster=CLUSTER    |
      --ssh-port=PORT      | 22
      --region-slug=NAME   | nyc2
      --region-id=ID       |
      --image-slug=NAME    | ubuntu-12-04-x64
      --image-id=ID        |
      --image-name=NAME    |
      --size-slug=NAME     | 512mb
      --size-id=ID         |

    Example:
    $ overcast instance create db.01 --cluster=db --size-slug=1gb --region-slug=sfo1

  overcast digitalocean destroy [instance]
    Destroys a DigitalOcean droplet and removes it from your account.
    Using --force overrides the confirm dialog. This is irreversible.

      Option               | Default
      --force              | false

    Example:
    $ overcast digitalocean destroy app.01

  overcast digitalocean droplets
    List all DigitalOcean droplets in your account.

  overcast digitalocean images
    List all available DigitalOcean images. Includes snapshots.

  overcast digitalocean poweron [instance]
    Power on a powered off droplet.

  overcast digitalocean reboot [instance]
    Reboots a DigitalOcean droplet. According to the API docs, "this is the
    preferred method to use if a server is not responding."

    Example:
    $ overcast digitalocean reboot app.01

  overcast digitalocean rebuild [instance] [options]
    Rebuild a DigitalOcean droplet using a specified image name, slug or ID.
    According to the API docs, "This is useful if you want to start again but
    retain the same IP address for your droplet."

      Option               | Default
      --image-slug=SLUG    | ubuntu-12-04-x64
      --image-name=NAME    |
      --image-id=ID        |

    Example:
    $ overcast digitalocean rebuild app.01 --name=my.app.snapshot

  overcast digitalocean regions
    List available DigitalOcean regions (nyc2, sfo1, etc).

  overcast digitalocean resize [name] [options]
    Shutdown, resize, and reboot a DigitalOcean droplet.
    If --skipboot flag is used, the droplet will stay in a powered-off state.

      Option               | Default
      --size-slug=NAME     |
      --size-id=ID         |
      --skipBoot           | false

    Example:
    $ overcast instance resize db.01 --size-slug=2gb

  overcast digitalocean sizes
    List available DigitalOcean sizes (512mb, 1gb, etc).

  overcast digitalocean shutdown [instance]
    Shut down a DigitalOcean droplet.

    Example:
    $ overcast digitalocean shutdown app.01

  overcast digitalocean snapshot [instance] [snapshot-name]
    Creates a named snapshot of a droplet. This process will reboot the instance.

    Example:
    $ overcast digitalocean snapshot app.01

  overcast digitalocean snapshots
    Lists available snapshots in your DigitalOcean account.
```

### overcast expose

```
  overcast expose [instance|cluster|all] [port...]
    Reset the exposed ports on the instance or cluster using iptables.
    This will fail if you don't include the current SSH port.
    Expects an Ubuntu server, untested on other distributions.

    Examples:
    $ overcast expose redis 22 6379
    $ overcast expose mysql 22 3306
    $ overcast expose app 22 80 443
```

### overcast exposed

```
  overcast exposed [instance|cluster|all]
    List the exposed ports on the instance or cluster.
    Expects an Ubuntu server, untested on other distributions.
```

### overcast health

```
  overcast health [instance|cluster|all]
    Export common health statistics in JSON format.
    Expects an Ubuntu server, untested on other distributions.

    Example JSON:
    {
      "my_instance_name": {
        "cpu_load_1min": 0.53,
        "cpu_load_5min": 0.05,
        "cpu_load_15min": 0.10,
        "disk_space_used_percentage": "72%",
        "disk_space_total": 19592,            // in MB
        "disk_space_used": 13445,             // in MB
        "disk_space_available": 5339,         // in MB
        "memory_total": 1000,                 // in MB
        "memory_used": 904,                   // in MB
        "memory_free": 96,                    // in MB
        "memory_used_with_cache": 589,        // in MB
        "memory_free_with_cache": 410,        // in MB
        "swap_total": 255,                    // in MB
        "swap_used": 124,                     // in MB
        "swap_free": 131,                     // in MB
        "open_tcp_connections": 152,
        "processes": [
          {
            "user": "root",
            "pid": 1,
            "cpu%": 0,
            "mem%": 0,
            "time": "0:01",
            "command": "/sbin/init"
          }
        ]
      }
    }
```

### overcast help

```
  Overcast v0.1.11

  Code repo, issues, pull requests:
    https://github.com/andrewchilds/overcast

  Usage:
    overcast [command] [options...]

  Help:
    overcast help
    overcast help [command]
    overcast [command] help

  Commands:
    overcast cluster list
    overcast cluster create [name]
    overcast cluster rename [name] [new-name]
    overcast cluster remove [name]
    overcast completions
    overcast digitalocean create [instance] [options]
    overcast digitalocean destroy [instance]
    overcast digitalocean droplets
    overcast digitalocean images
    overcast digitalocean poweron [instance]
    overcast digitalocean reboot [instance]
    overcast digitalocean rebuild [instance] [options]
    overcast digitalocean regions
    overcast digitalocean resize
    overcast digitalocean sizes
    overcast digitalocean shutdown [instance]
    overcast digitalocean snapshot [instance] [snapshot-name]
    overcast digitalocean snapshots
    overcast expose [instance|cluster|all] [port...]
    overcast exposed [instance|cluster|all]
    overcast health [instance|cluster|all]
    overcast info
    overcast init
    overcast instance create [name] [options]
    overcast instance import [name] [options]
    overcast instance remove [name]
    overcast instance update [name] [options]
    overcast list
    overcast ping [instance|cluster|all]
    overcast port [instance|cluster|all] [port]
    overcast pull [instance|cluster|all] [source] [dest]
    overcast push [instance|cluster|all] [source] [dest]
    overcast run [instance|cluster|all] [command...]
    overcast run [instance|cluster|all] [file...]
    overcast ssh [instance]

  Config directory:
    /path/to/.overcast
```

### overcast info

```
  overcast info
    Pretty-prints the complete clusters.json file, stored here:
    /path/to/.overcast/clusters.json
```

### overcast init

```
  overcast init
    Create an .overcast config directory in the current working directory.
    No action taken if one already exists.
```

### overcast instance

```
  overcast instance create [name] [options]
    Creates a new instance on a hosting provider. You'll need to add your API
    credentials to the .overcast/variables.json file for this to work.
    See the .overcast/example.variables.json file for reference.

    The instance will start out using the auto-generated SSH key found here:
    /path/to/.overcast/keys/overcast.key.pub

    You can specify region, image, and size of the droplet using -id or -slug.
    You can also specify an image or snapshot using --image-name.

      Option               | Default
      --cluster=CLUSTER    |
      --provider=NAME      | digitalocean
      --ssh-port=PORT      | 22
      --region-slug=NAME   | nyc2
      --region-id=ID       |
      --image-slug=NAME    | ubuntu-12-04-x64
      --image-id=ID        |
      --image-name=NAME    |
      --size-slug=NAME     | 512mb
      --size-id=ID         |

    Example:
    $ overcast instance create db.01 --cluster=db --host=digitalocean

  overcast instance import [name] [options]
    Imports an existing instance to a cluster.

      Option               | Default
      --cluster=CLUSTER    |
      --ip=IP              |
      --ssh-port=PORT      | 22
      --ssh-key=PATH       | .overcast/keys/overcast.key
      --user=USERNAME      | root

    Example:
    $ overcast instance import app.01 --cluster=app --ip=127.0.0.1 \
        --ssh-port=22222 --ssh-key=$HOME/.ssh/id_rsa

  overcast instance update [name] [options]
    Update any instance property. Specifying --cluster will move the instance to
    that cluster. Specifying --name will rename the instance.

      Option               | Default
      --name=NAME          |
      --cluster=CLUSTER    |
      --ip=IP              |
      --ssh-port=PORT      | 22
      --ssh-key=PATH       | .overcast/keys/overcast.key
      --user=USERNAME      | root

    Example:
    $ overcast instance update app.01 --user=differentuser --ssh-key=/path/to/another/key

  overcast instance remove [name]
    Removes an instance from the index.
    The server itself is not affected by this action.

    Example:
    $ overcast instance remove app.01
```

### overcast list

```
  overcast list
    Short list of your cluster and instance definitions, stored here:
    /path/to/.overcast/clusters.json
```

### overcast ping

```
  overcast ping [instance|cluster|all]
    Ping an instance or cluster.

      Option    | Default
      --count=N | 3

    Examples:
    $ overcast ping app.01
    $ overcast ping db --count=5
```

### overcast port

```
  overcast port [instance|cluster|all] [port]
    Change the SSH port for an instance or a cluster.
    Careful, this port should already be open!

    Examples:
    $ overcast port app.01 22222
    $ overcast port db 22222
```

### overcast pull

```
  overcast pull [instance|cluster|all] [source] [dest]
    Pull a file or directory from an instance or cluster using scp. Source is absolute.
    Destination can be absolute or relative to the .overcast/files directory.

    Any reference to {instance} in the destination will be replaced with the instance name.

    Example:
    Assuming instances "app.01" and "app.02", this will expand to:
      - .overcast/files/nginx/app.01.myapp.conf
      - .overcast/files/nginx/app.02.myapp.conf
    $ overcast pull app /etc/nginx/sites-enabled/myapp.conf nginx/{instance}.myapp.conf
```

### overcast push

```
  overcast push [instance|cluster|all] [source] [dest]
    Push a file or directory to an instance or cluster using scp. Source can be
    absolute, or relative to the .overcast/files directory. Destination is absolute.

    Any reference to {instance} in the source will be replaced with the instance name.

    Example:
    Assuming instances "app.01" and "app.02", this will expand to:
      - .overcast/files/nginx/app.01.myapp.conf
      - .overcast/files/nginx/app.02.myapp.conf
    $ overcast push app nginx/{instance}.myapp.conf /etc/nginx/sites-enabled/myapp.conf
```

### overcast run

```
  overcast run [instance|cluster|all] [command...]
    Runs a command or series of commands on an instance or cluster.
    Commands will run sequentially unless you use the --parallel flag,
    in which case each command will run on all instances simultanously.

      Option
      --env="KEY=VAL KEY='1 2 3'"
      --parallel -p

    Examples:
    $ overcast run app --env="foo='bar bar' testing=123" env
    $ overcast run all uptime "free -m" "df -h"

  overcast run [instance|cluster|all] [file...]
    Executes a script file or files on an instance or cluster.
    Script files can be either absolute or relative path.
    Script files will run sequentially unless you use the --parallel flag,
    in which case each file will execute on all instances simultanously.

      Option
      --env="KEY=VAL KEY='1 2 3'"
      --parallel -p

    Relative paths are relative to this directory:
    /path/to/.overcast/scripts

    Example:
    $ overcast run db install/core install/redis
```

### overcast ssh

```
  overcast ssh [instance]
    Opens an SSH connection to an instance.
```

## Running the Tests

[![Build Status](https://travis-ci.org/andrewchilds/overcast.svg?branch=master)](https://travis-ci.org/andrewchilds/overcast)

```sh
npm install
npm test
```

## Upgrading Overcast

```sh
npm -g update overcast
```

Configuration files are left alone during an upgrade.

## Contributing

Contributions are very welcome. If you've got an idea for a feature or found a bug, please [open an issue](https://github.com/andrewchilds/overcast/issues). If you're a developer and want to help make Overcast better, [open a pull request](https://github.com/andrewchilds/overcast/pulls) with your changes.

## Roadmap

- Linode support
- AWS EC2 support
- Better test coverage
- Improved script library bundle

## License

MIT. Copyright &copy; 2014 [Andrew Childs](http://twitter.com/andrewchilds).
