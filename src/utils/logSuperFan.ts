import chalk from 'chalk';
import { VoiceBasedChannel } from 'discord.js';

export default function logSuperFan(channel: VoiceBasedChannel) {
  console.log(
    [
      new Date().toLocaleString('en-GB'),
      chalk.blueBright(`[${channel.guild.name}]`),
      chalk.yellow('Atskaņošana uzsākta superfana dēļ'),
    ].join(' ')
  );
}
