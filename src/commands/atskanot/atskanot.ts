import radioInfo, { RadioName } from '../../radioList';
import {
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import atskanotConfig from './atskanotConfig';
import logCommand from '../../utils/logCommand';
import atskanotEmbed from './atskanotEmbed';
import ephemeralEmbed from '../../utils/ephemeralEmbed';
import { Command } from '../commandHandler';
import { playRadioInChannel } from '../../utils/playRadioInChannel';

const atskanot: Command = {
  config: atskanotConfig,
  async run(i) {
    const { channel } = i.member.voice;

    if (!channel) {
      return i
        .reply(ephemeralEmbed('❌ Pievienojies balss kanālam lai atskaņotu radio'))
        .catch(_ => _);
    }

    const bot = i.guild.members.me!;

    if (!channel.viewable) {
      return i
        .reply(ephemeralEmbed(`❌ Bots neredz kanālu ${channel}, tāpēc tam nevar pievienoties`))
        .catch(_ => _);
    }

    if (!channel.joinable) {
      return i
        .reply(ephemeralEmbed(`❌ Botam nav atļaujas pievienoties kanālam ${channel}`))
        .catch(_ => _);
    }

    const chosenRadio = i.options.getString('radio') as RadioName;
    if (!chosenRadio || !radioInfo[chosenRadio]) {
      return i
        .reply(ephemeralEmbed('❌ Šis radio neeksistē, lūdzu, izvēlies kādu radio no saraksta'))
        .catch(_ => _);
    }

    const { img, url, color } = radioInfo[chosenRadio];

    let currentConnection = getVoiceConnection(i.guildId);
    if (channel.id !== bot.voice.channelId) {
      currentConnection?.destroy();
      currentConnection = undefined;
    }

    let connection = currentConnection;

    // if (connection?.player?.radioUrl === chosenRadio) {
    //   return i
    //     .reply(ephemeralEmbed(`❌ Balss kanālā jau tiek atskaņots **${chosenRadio}**`))
    //     .catch(_ => _);
    // }

    let memberCount = channel.members.size;
    if (bot.voice.channel && bot.voice.channelId === channel.id) memberCount--;

    i.reply(atskanotEmbed(chosenRadio, channel, memberCount, img, color)).catch(_ => _);
    logCommand(i);

    playRadioInChannel(channel, chosenRadio)
  },
};

export default atskanot;
