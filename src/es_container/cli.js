import getopts from 'getopts';
import dedent from 'dedent';
import chalk from 'chalk';

import * as commands from './commands';

function help() {
  const availableCommands = Object.keys(commands)
    .map(commandName => commands[commandName])
    .map(command => `${command.name} - ${command.description}`);

  console.log(dedent`
    usage: elasticsearch <command> [<args>]

    Tool for managing Elasticsearch instances for Kibana development

    Available commands:

       ${availableCommands.join('\n')}
  `);
}

export async function run(argv) {
  const options = getopts(argv, {
    alias: {
      h: 'help'
    }
  });

  const args = options._;

  if (options.help || args.length === 0) {
    help();
    return;
  }

  const commandName = args[0];
  const command = commands[commandName];

  if (command === undefined) {
    console.log(
      chalk.red(`[${commandName}] is not a valid command, see 'kbn --help'`)
    );
    process.exit(1);
  }

  await command.run(options);
}
