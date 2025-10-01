import { Client, GatewayIntentBits, VoiceState } from 'discord.js';
import commandHandler from './commands/commandHandler';
import setBotPresence from './utils/setBotPresence';
import chalk from 'chalk';
import validateEnv from './utils/validateEnv';
import 'dotenv/config';
import { generateDependencyReport } from '@discordjs/voice';
import logSuperFan from './utils/logSuperFan';
import { playRadioInChannel } from './utils/playRadioInChannel';

import radioInfo, { RadioName } from './radioList';

if (!validateEnv()) process.exit(1);


const rawRadio = process.env.SUPERFAN_RADIO_NAME;
if (!rawRadio || !(rawRadio in radioInfo)) {
  throw new Error(`Invalid SUPERFAN_RADIO_NAME env value: ${rawRadio}`);
}
const SUPERFAN_RADIO_NAME = rawRadio as RadioName;


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once('ready', bot => {
  console.log(`${chalk.yellow(bot.user.tag)} logged in`);
  console.log(generateDependencyReport());

  setBotPresence(bot);
  setInterval(() => setBotPresence(bot), 3_600_000);
});

client.on('interactionCreate', i => {
  if (i.isChatInputCommand()) commandHandler(i);
});

client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
  if (!oldState.channel && newState.channel) {
    const member = newState.member;
    if (!member) return;

    if (member.roles.cache.some(role => role.name === process.env.SUPERFAN_ROLE_NAME)) {
      logSuperFan(newState.channel)
      playRadioInChannel(newState.channel, SUPERFAN_RADIO_NAME)
    }
  }
});

client.login(process.env.TOKEN);
