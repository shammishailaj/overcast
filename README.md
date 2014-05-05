# ![Overcast Logo](http://i.imgur.com/eCBl2NI.png)

Overcast is an SSH-based devops CLI designed to make it easy to spin up, configure and manage clusters of machines, without the learning curve or complexity of existing devops tools.

![Screenshot](http://i.imgur.com/qWUV684.png)

## Concepts

- **Instances** are any machine you can SSH into.
- **Clusters** are sets of instances.

## Features

Create, reboot and destroy instances across DigitalOcean, Linode and EC2:

```sh
# Create a new cluster called "db":
$ overcast cluster create db

# Spin up a new Ubuntu 14.04 instance on DigitalOcean:
$ overcast digitalocean create db-01 --cluster db

# Spin up a new Ubuntu 14.04 instance on Linode:
$ overcast linode create db-02 --cluster db

# Spin up a new Ubuntu 14.04 instance on EC2:
$ overcast aws create db-03 --cluster db --user ubuntu
$ overcast run db-03 allow_root_access_on_ec2
$ overcast instance update db-03 --user root

# Install Redis across all instances in parallel:
$ overcast run db install/core install/redis --parallel

# SSH into any instance:
$ overcast ssh db-01

# SSH into a whole cluster:
$ overcast ssh db
```

Import your already-running machines, wherever they are, using `overcast instance import` or by editing [`~/.overcast/clusters.json`](https://github.com/andrewchilds/overcast/tree/master/fixtures/example.clusters.json):

```sh
$ overcast instance import app-01 --ip 1.1.1.1 --ssh-key ~/.ssh/id_rsa
$ overcast instance import app-02 --ip 2.2.2.2 --ssh-key ~/.ssh/id_rsa
```

Run multiple commands or multiple scripts on any or all of your instances at once, over SSH. Commands can be run sequentially or in parallel using the `--parallel` flag.

```sh
$ overcast run db install/core install/redis
$ overcast run all uptime "free-m" "df -h" --parallel
```

Push and pull files between your local machine and any or all of your instances at once. Dynamically rewrite file paths to include the instance name using `{instance}` in either source or destination.

```sh
$ overcast push app nginx/myapp.conf /etc/nginx/sites-enabled/myapp.conf
$ overcast pull all /etc/nginx/sites-enabled/myapp.conf nginx/{instance}.myapp.conf
```

Overcast is a thin wrapper around your native SSH client, and doesn't install or leave anything on the servers you communicate with, so Overcast itself has no real attack surface.

A [script library](https://github.com/andrewchilds/overcast/tree/master/scripts) and [recipe library](https://github.com/andrewchilds/overcast/tree/master/recipes) are included to make it easy to deploy common software stacks and applications. The library was written for Ubuntu, but could be extended to include other distributions.

## Installation (OS X/Linux)

1. Install [Node.js](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) if not already installed.

2. Install Overcast using npm.

    ```sh
    $ npm -g install overcast
    ```

3. You can now use Overcast from any directory.

    ```sh
    $ overcast help
    ```

## Uninstallation

Since Overcast is just a wrapper around SSH, there is nothing on your remote machines to uninstall. To uninstall Overcast from your local machine:

```sh
# To remove the Overcast package:
$ npm -g remove overcast
# Optionally delete your Overcast SSH keys and configuration files:
$ rm -rf ~/.overcast
```

## Configuration

Overcast looks for an `.overcast` directory in the current directory, a parent directory, or `~/.overcast`, in that order. This means you can have multiple configurations and treat your server infrastructure like source code.

The command `overcast init` will create a new configuration in the current directory. The config directory looks like this:

```sh
/.overcast
  /files            # Files to be pushed to / pulled from instances
  /keys             # SSH keys, can be your own or auto-generated by overcast
    overcast.key
    overcast.key.pub
  /scripts          # Scripts to be run on instances
  clusters.json     # Cluster/instance definitions (see example.clusters.json)
  variables.json    # API keys, etc (see example.variables.json)
```

## Design Goals &amp; Motivation

There are many server management frameworks out there already, but they generally involve a complex server-client implementation, a steep learning curve, or a giant, monolithic conceptual framework that requires taking a course to understand.

I wanted something that had little to no learning curve, that did only what you asked it to do on the remote machines and nothing more, that just focused on multi-server provisioning and communication and leaves problems like process/state management and system monitoring to tools designed specifically for those problems.

## Example App Deployment Recipes

  - [Discourse](https://github.com/andrewchilds/overcast/blob/master/recipes/discourse)
  - [Overcast Charts](https://github.com/andrewchilds/overcast-charts)

## Command Reference

### overcast aliases

```
  overcast aliases
    Return a list of bash aliases for SSHing to your instances.

    To use, add this to your .bash_profile:
    test -f $HOME/.overcast_aliases && source $HOME/.overcast_aliases

    And then create the .overcast_aliases file:
    overcast aliases > $HOME/.overcast_aliases
```

### overcast aws

```
  These commands require the following values set in .overcast/variables.json:
    AWS_KEY
    AWS_SECRET

  overcast aws create [name] [options...]
    Creates a new EC2 instance.

      Option                   | Default
      --cluster CLUSTER        |
      --ami NAME               | ami-018c9568 (Ubuntu 14.04 LTS, 64bit, EBS)
      --size NAME              | t1.micro
      --monitoring BOOLEAN     | false
      --user NAME              | root
      --ssh-key KEY_PATH       | overcast.key
      --ssh-pub-key KEY_PATH   | overcast.key.pub

    Example:
    $ overcast aws create db.01 --cluster db --size m1.small --user ubuntu

  overcast aws destroy [name]
    Destroys an EC2 instance.

      Option                   | Default
      --force                  | false

    Example:
    $ overcast aws destroy db.01

  overcast aws reboot [name]
    Reboots an EC2 instance.

    Example:
    $ overcast aws reboot db.01

  overcast aws start [name]
    Starts an EC2 instance.

    Example:
    $ overcast aws start db.01

  overcast aws stop [name]
    Stop an EC2 instance.

    Example:
    $ overcast aws stop db.01
```

### overcast cluster

```
  overcast cluster list
    Alias for overcast list.

  overcast cluster count [name]
    Return the number of instances in a cluster.

    Example:
    $ overcast cluster count db
    > 0
    $ overcast instance create db.01 --cluster db
    > ...
    $ overcast cluster count db
    > 1

  overcast cluster create [name]
    Creates a new cluster.

    Example:
    $ overcast cluster create db

  overcast cluster rename [name] [new-name]
    Renames a cluster.

    Example:
    $ overcast cluster rename app-cluster app-cluster-renamed

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

      Option                | Default
      --cluster CLUSTER     |
      --ssh-port PORT       | 22
      --region-slug NAME    | nyc2
      --region-id ID        |
      --image-slug NAME     | ubuntu-14-04-x64
      --image-id ID         |
      --image-name NAME     |
      --size-slug NAME      | 512mb
      --size-id ID          |
      --backups-enabled     | false
      --private-networking  | false

    Example:
    $ overcast digitalocean create db.01 --cluster db --size-slug 1gb --region-slug sfo1

  overcast digitalocean destroy [name]
    Destroys a DigitalOcean droplet and removes it from your account.
    Using --force overrides the confirm dialog. This is irreversible.

      Option                | Default
      --force               | false

  overcast digitalocean droplets
    List all DigitalOcean droplets in your account.

  overcast digitalocean images
    List all available DigitalOcean images. Includes snapshots.

  overcast digitalocean poweron [name]
    Power on a powered off droplet.

  overcast digitalocean reboot [name]
    Reboots a DigitalOcean droplet. According to the API docs, "this is the
    preferred method to use if a server is not responding."

  overcast digitalocean rebuild [name] [options]
    Rebuild a DigitalOcean droplet using a specified image name, slug or ID.
    According to the API docs, "This is useful if you want to start again but
    retain the same IP address for your droplet."

      Option                | Default
      --image-slug SLUG     | ubuntu-12-04-x64
      --image-name NAME     |
      --image-id ID         |

    Example:
    $ overcast digitalocean rebuild app.01 --name my.app.snapshot

  overcast digitalocean regions
    List available DigitalOcean regions (nyc2, sfo1, etc).

  overcast digitalocean resize [name] [options]
    Shutdown, resize, and reboot a DigitalOcean droplet.
    If --skipboot flag is used, the droplet will stay in a powered-off state.

      Option                | Default
      --size-slug NAME      |
      --size-id ID          |
      --skipBoot            | false

    Example:
    $ overcast digitalocean resize db.01 --size-slug 2gb

  overcast digitalocean sizes
    List available DigitalOcean sizes (512mb, 1gb, etc).

  overcast digitalocean shutdown [name]
    Shut down a DigitalOcean droplet.

  overcast digitalocean snapshot [name] [snapshot-name]
    Creates a named snapshot of a droplet. This process will reboot the instance.

    Example:
    $ overcast digitalocean snapshot db.01 db.01.snapshot

  overcast digitalocean snapshots
    Lists available snapshots in your DigitalOcean account.
```

### overcast expose

```
  overcast expose [instance|cluster|all] [port...]
    Reset the exposed ports on the instance or cluster using iptables.
    This will fail if you don't include the current SSH port.
    Specifying --whitelist will restrict all ports to the specified address(es).
    These can be individual IPs or CIDR ranges, such as "192.168.0.0/24".

    Expects an Ubuntu server, untested on other distributions.

      Option
      --user=NAME
      --whitelist "IP|RANGE..."
      --whitelist-PORT "IP|RANGE..."

    Examples:
    # Allow SSH, HTTP and HTTPS connections from anywhere:
    $ overcast expose app 22 80 443
    # Allow SSH from anywhere, only allow Redis connections from 1.2.3.4:
    $ overcast expose redis 22 6379 --whitelist-6379 "1.2.3.4"
    # Only allow SSH and MySQL connections from 1.2.3.4 or from 5.6.7.xxx:
    $ overcast expose mysql 22 3306 --whitelist "1.2.3.4 5.6.7.0/24"
```

### overcast exposed

```
  overcast exposed [instance|cluster|all]
    List the exposed ports on the instance or cluster.
    Expects an Ubuntu server, untested on other distributions.

      Option        | Default
      --user NAME   |
```

### overcast health

```
  overcast health [instance|cluster|all]
    Export common health statistics in JSON format.
    Expects an Ubuntu server, untested on other distributions.

    Example JSON:
    {
      "my_instance_name": {
        "cpu_1min": 0.53,
        "cpu_5min": 0.05,
        "cpu_15min": 0.10,
        "disk_total": 19592,     // in MB
        "disk_used": 13445,      // in MB
        "disk_free": 5339,       // in MB
        "mem_total": 1000,       // in MB
        "mem_used": 904,         // in MB
        "mem_free": 96,          // in MB
        "cache_used": 589,       // in MB
        "cache_free": 410,       // in MB
        "swap_total": 255,       // in MB
        "swap_used": 124,        // in MB
        "swap_free": 131,        // in MB
        "tcp": 152,              // open TCP connections
        "rx_bytes": 196396703,   // total bytes received
        "tx_bytes": 47183785,    // total bytes transmitted
        "io_reads": 1871210,     // total bytes read
        "io_writes": 6446448,    // total bytes written
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
  Overcast v0.4.2

  Source code, issues, pull requests:
    https://github.com/andrewchilds/overcast

  Usage:
    overcast [command] [options...]

  Help:
    overcast help
    overcast help [command]
    overcast [command] help

  Commands:
    overcast aliases
    overcast aws create [name] [options...]
    overcast aws destroy [name]
    overcast aws reboot [name]
    overcast aws start [name]
    overcast aws stop [name]
    overcast cluster list
    overcast cluster count [name]
    overcast cluster create [name]
    overcast cluster rename [name] [new-name]
    overcast cluster remove [name]
    overcast completions
    overcast digitalocean create [name] [options]
    overcast digitalocean destroy [name]
    overcast digitalocean droplets
    overcast digitalocean images
    overcast digitalocean poweron [name]
    overcast digitalocean reboot [name]
    overcast digitalocean rebuild [name] [options]
    overcast digitalocean regions
    overcast digitalocean resize
    overcast digitalocean sizes
    overcast digitalocean shutdown [name]
    overcast digitalocean snapshot [name] [snapshot-name]
    overcast digitalocean snapshots
    overcast expose [instance|cluster|all] [port...] [options]
    overcast exposed [instance|cluster|all]
    overcast health [instance|cluster|all]
    overcast info
    overcast init
    overcast instance get [instance|cluster|all] [attr...]
    overcast instance import [name] [options...]
    overcast instance list [cluster...]
    overcast instance remove [name]
    overcast instance update [name] [options...]
    overcast key create [name]
    overcast key delete [name]
    overcast key get [name] [option]
    overcast key list
    overcast linode boot [name]
    overcast linode create [name] [options]
    overcast linode datacenters
    overcast linode destroy [name]
    overcast linode distributions
    overcast linode kernels
    overcast linode linodes
    overcast linode plans
    overcast linode reboot [name]
    overcast linode shutdown [name]
    overcast list
    overcast ping [instance|cluster|all]
    overcast port [instance|cluster|all] [port]
    overcast pull [instance|cluster|all] [source] [dest]
    overcast push [instance|cluster|all] [source] [dest]
    overcast reboot [instance|cluster|all]
    overcast run [instance|cluster|all] [command...]
    overcast run [instance|cluster|all] [file...]
    overcast ssh [instance|cluster|all]

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
  overcast instance get [instance|cluster|all] [attr...]
    Returns the attribute(s) for the instance or cluster, one per line.

    Examples:
    $ overcast instance get app.01 ssh-port
    > 22
    $ overcast instance get app-cluster ip
    > 127.0.0.1
    > 127.0.0.2
    > 127.0.0.3

  overcast instance import [name] [options]
    Imports an existing instance to a cluster.

      Option               | Default
      --cluster CLUSTER    |
      --ip IP              |
      --ssh-port PORT      | 22
      --ssh-key PATH       | overcast.key
      --user USERNAME      | root

    Example:
    $ overcast instance import app.01 --cluster app --ip 127.0.0.1 \
        --ssh-port 22222 --ssh-key $HOME/.ssh/id_rsa

  overcast instance list [cluster...]
    Returns all instance names, one per line. Optionally limit to one or more clusters.

    Examples:
    $ overcast instance list
    $ overcast instance list app-cluster db-cluster

  overcast instance remove [name]
    Removes an instance from the index.
    The server itself is not affected by this action.

    Example:
    $ overcast instance remove app.01

  overcast instance update [name] [options]
    Update any instance property. Specifying --cluster will move the instance to
    that cluster. Specifying --name will rename the instance.

      Option               | Default
      --name NAME          |
      --cluster CLUSTER    |
      --ip IP              |
      --ssh-port PORT      |
      --ssh-key PATH       |
      --user USERNAME      |

    Example:
    $ overcast instance update app.01 --user differentuser --ssh-key /path/to/another/key
```

### overcast key

```
  overcast key create [name]
    Creates a new SSH key in the current .overcast config.

    Example:
    $ overcast key create myKeyName
    > New SSH key "myKeyName" created.
    > /path/to/.overcast/keys/myKeyName.key
    > /path/to/.overcast/keys/myKeyName.key.pub

  overcast key delete [name]
    Deletes SSH public/private key files from the current .overcast config.

    Example:
    $ overcast key delete myKeyName
    > SSH key "myKeyName" deleted.

  overcast key get [name] [option]
    Display the requested SSH key data or path from the current .overcast config.
    Defaults to displaying the public key data if no option found.

      Option
      --public-data
      --private-data
      --public-path
      --private-path

    Examples:
    $ overcast key get myKeyName
    > [public key data]
    $ overcast key get myKeyName --private-data
    > [private key data]

  overcast key list
    List the found SSH key names in the current .overcast config.

    Examples:
    $ overcast key list
    > myKeyName
    > overcast
```

### overcast linode

```
  These functions require LINODE_API_KEY property to be set in .overcast/variables.json.
  API keys can be found at https://manager.linode.com/profile/api

  overcast linode boot [name]
    Boot a powered off linode.

  overcast linode create [name] [options]
    Creates a new Linode.

      Option                    | Default
      --cluster CLUSTER         |
      --datacenter-slug NAME    | newark
      --datacenter-id ID        |
      --distribution-slug NAME  | ubuntu-14-04-lts
      --distribution-id ID      |
      --kernel-id ID            |
      --kernel-name NAME        | Latest 64 bit
      --payment-term ID         | 1 (monthly, if not metered)
      --plan-id ID              |
      --plan-slug NAME          | 2048
      --password PASSWORD       | autogenerated
      --ssh-key KEY_PATH        | overcast.key
      --ssh-pub-key KEY_PATH    | overcast.key.pub

    Example:
    $ overcast linode create db.01 --cluster db --datacenter-slug london

  overcast linode datacenters
    List available Linode datacenters.

  overcast linode destroy [name]
    Destroys a linode and removes it from your account.
    Using --force overrides the confirm dialog. This is irreversible.

      Option                    | Default
      --force                   | false

  overcast linode distributions
    List available Linode distributions.

  overcast linode kernels
    List available Linode kernels.

  overcast linode linodes
    List all linodes in your account.

  overcast linode plans
    List available Linode plans.

  overcast linode reboot [name]
    Reboots a linode.

  overcast linode resize [name] [options]
    Resizes a linode to the specified plan. This will immediately shutdown and migrate your linode.

      Option                    | Default
      --plan-id ID              |
      --plan-slug NAME          |

  overcast linode shutdown [name]
    Shut down a linode.
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
      --count N | 3

    Examples:
    $ overcast ping app.01
    $ overcast ping db --count 5
```

### overcast port

```
  overcast port [instance|cluster|all] [port]
    Change the SSH port for an instance or a cluster.
    This command will fail if the new port is not opened by iptables.

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

      Option
      --user NAME

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

      Option
      --user NAME

    Example:
    Assuming instances "app.01" and "app.02", this will expand to:
      - .overcast/files/nginx/app.01.myapp.conf
      - .overcast/files/nginx/app.02.myapp.conf
    $ overcast push app nginx/{instance}.myapp.conf /etc/nginx/sites-enabled/myapp.conf
```

### overcast reboot

```
  overcast reboot [instance|cluster|all]
    Reboot an instance or cluster.
    If the instance was created using DigitalOcean or Linode, this will use the provider API,
    otherwise will execute "reboot" command on the server and wait for 60 seconds.
```

### overcast run

```
  overcast run [instance|cluster|all] [command...]
    Runs a command or series of commands on an instance or cluster.
    Commands will run sequentially unless you use the --parallel flag,
    in which case each command will run on all instances simultanously.

      Option                          | Default
      --env "KEY=VAL KEY='1 2 3'"     |
      --user NAME                     |
      --ssh-key PATH                  |
      --parallel -p                   | false
      --continueOnError               | false

    Examples:
    $ overcast run app --env "foo='bar bar' testing=123" env
    $ overcast run all uptime "free -m" "df -h"

  overcast run [instance|cluster|all] [file...]
    Executes a script file or files on an instance or cluster.
    Script files can be either absolute or relative path.
    Script files will run sequentially unless you use the --parallel flag,
    in which case each file will execute on all instances simultanously.

      Option                          | Default
      --env "KEY=VAL KEY='1 2 3'"     |
      --user NAME                     |
      --ssh-key PATH                  |
      --shell-command "COMMAND"       | bash -s
      --parallel -p                   | false
      --continueOnError               | false

    Relative paths are relative to the cwd, or to these directories:
    /path/to/.overcast/scripts
    /path/to/installed/overcast/scripts

    Example:
    $ overcast run db install/core install/redis
```

### overcast ssh

```
  overcast ssh [instance|cluster|all]
    Opens an interactive SSH connection to an instance or cluster.
    Because what could possibly go wrong?

    Option
    --ssh-key PATH
    --user NAME
```

## Running the Tests

[![Build Status](https://travis-ci.org/andrewchilds/overcast.svg?branch=master)](https://travis-ci.org/andrewchilds/overcast)

```sh
git clone https://github.com/andrewchilds/overcast.git
cd overcast
npm test
```

## Upgrading Overcast

```sh
npm -g update overcast
```

Configuration files are left alone during an upgrade.

## Contributing

Contributions are welcome. If you've got an idea for a feature or found a bug, please [open an issue](https://github.com/andrewchilds/overcast/issues). If you're a developer and want to help improve Overcast, [open a pull request](https://github.com/andrewchilds/overcast/pulls) with your changes.

## Roadmap

- Tagging
- Events
- Google Compute Engine support
- [pkgcloud.compute](https://github.com/pkgcloud/pkgcloud#compute) integration (for Joyent, Openstack, Rackspace support)
- More comprehensive script/recipe library
- More test coverage

## License

MIT. Copyright &copy; 2014 [Andrew Childs](http://twitter.com/andrewchilds).
