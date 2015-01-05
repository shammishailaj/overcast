# Upgrading

```
npm -g update overcast
```

# Change Log

**0.6.7** (Jan 5, 2015)

- Rewrite `linode` command to use standard provider API.
- To improve consistency across providers, `datacenters`, `distributions`, `linodes`, and `plans` commands are renamed to `regions`, `images`, `instances`, and `sizes`, though the original command names are still quietly supported for backward compatibility. Update `linode create` command to expect --image, --size, --region, though the original options are still supported.
- Add `linode kernels` and `linode sync` commands.
- Add --swap option to `linode create` command.

**0.6.6** (Jan 2, 2015)

- Rewrite `virtualbox` command to use standard provider API.
- To improve consistency across providers, `start` and `stop` commands are renamed to `boot` and `shutdown`, though `start` and `stop` are still quietly supported for backward compatibility.

**0.6.5** (Jan 2, 2015)

- Rewrite `aws` command to use standard provider API.
- Fix issue where EC2 instances are no longer accessible after a restart.
- Add `aws regions` and `aws instances` commands.
- To improve consistency across providers, `start` and `stop` commands are renamed to `boot` and `shutdown`, though `start` and `stop` are still quietly supported for backward compatibility.
- Add --region option to `aws create` command, standardize to expect --image, though --ami is still quietly supported for backward compatibility.

**0.6.4** (Jan 1, 2015)

- Add support for ~/ and $HOME in SSH key paths. Closes [#27](https://github.com/andrewchilds/overcast/issues/27).
- Add `get` command, which maps to `instance get`. Add "origin" attribute and --single-line option to `instance get`. Closes [#29](https://github.com/andrewchilds/overcast/issues/29).

**0.6.3** (Dec 31, 2014)

- Rewrite `digitalocean` commands to use new standard provider API. Command options have been simplified, allowing for fuzzy matching of regions, images, and sizes based on ID, name, or slug. Closes [#25](https://github.com/andrewchilds/overcast/issues/25).
- Add `digitalocean sync` command.
- Display raw rsync/scp commands before spawning processes in `push` and `pull` commands.

**0.6.2** (Dec 13, 2014)

- Rewrite every command except providers using new compact declarative syntax. Fixes [#24](https://github.com/andrewchilds/overcast/issues/24). Providers are next.
- Improve `ssh` command to behave exactly like standalone SSH, by inheriting the existing terminal stdio.
- Change `import` command signature to expect an [ip] argument.
- Change `ping` command to only return the average response time from each instance.

**0.6.1** (Dec 2, 2014)

- Improve module loading routine. 1.5x speed improvement.
- Fix issue where tab/up/down/ctrl characters aren't rendered correctly in `ssh` command. Fixes [#26](https://github.com/andrewchilds/overcast/issues/26).

**0.6.0** (Nov 9, 2014)

- Improve `reboot` command by replacing fixed wait time with real connectivity testing. Fixes [#22](https://github.com/andrewchilds/overcast/issues/22) and [#23](https://github.com/andrewchilds/overcast/issues/23).
- Add `wait` command.
- Add `destroy` command, which maps to `[provider] destroy`.

**0.5.9** (Nov 3, 2014)

- Add `scriptvar` command.

**0.5.8** (Oct 23, 2014)

- Add `--machine-readable` option to `run` command.

**0.5.7** (Oct 23, 2014)

- Add `var list` command.

**0.5.6** (Oct 23, 2014)

- Add `var` command.

**0.5.5** (Sep 16, 2014)

- Fix issue around relative paths for push/pull commands. Fixes [#21](https://github.com/andrewchilds/overcast/issues/21).
- Add `install/imagemagick` script.

**0.5.4** (Jul 7, 2014)

- Allow `--ssh-key` args in digitalocean create command. Fixes [#19](https://github.com/andrewchilds/overcast/issues/19).

**0.5.3** (Jun 14, 2014)

- Allow programmatic usage in other node.js programs.

**0.5.2** (May 27, 2014)

- Fix issue with alternate pub keys in virtualbox create command.

**0.5.1** (May 22, 2014)

- Handle cases where SLACK_WEBHOOK_URL is missing.

**0.5.0** (May 22, 2014)

- Add `import` and `remove` alias commands.