// radioPlayer.ts
import { VoiceBasedChannel, Guild } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, entersState, getVoiceConnection } from '@discordjs/voice';
import logDisconnect from './logDisconnect';
import radioInfo, { RadioName } from '../radioList';

export async function playRadioInChannel(channel: VoiceBasedChannel, chosenRadio: RadioName) {
  const bot = channel.guild.members.me!;
  let currentConnection = getVoiceConnection(channel.guildId);
  if (channel.id !== bot.voice.channelId) {
    currentConnection?.destroy();
    currentConnection = undefined;
  }

  let connection = currentConnection;
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    // ja bots zaudē savienojumu tad mēģinās atsākt atskaņošanu
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (e) {
        try {
          connection?.destroy();
          // eslint-disable-next-line no-empty
        } catch (e) { }
      }
    });

    connection.once(VoiceConnectionStatus.Destroyed, () => {
      connection?.player.stop(true);
      connection?.removeAllListeners();
      logDisconnect(channel);
    });

    // neliela šizofrēnija
    connection.player = createAudioPlayer();
  }

  connection.subscribe(connection.player);

  const { img, url, color } = radioInfo[chosenRadio];

  const audioResource = createAudioResource(url);
  connection.player.play(audioResource);
  connection.player.radioUrl = chosenRadio;

  connection.setSpeaking(true);

  if (currentConnection) return;

  // ik 5 sekundes pārbauda vai bots ir viens pats balss kanālā vai arī bots ir atvienots
  let isAlone = false;
  while (!isAlone) {
    if (connection.state.status === VoiceConnectionStatus.Destroyed) return;

    isAlone = await new Promise(res => {
      setTimeout(() => res(!bot?.voice?.channel || bot.voice.channel.members.size <= 1), 5000);
    });
  }

  try {
    connection.destroy();
    // eslint-disable-next-line no-empty
  } catch (e) { }
}
