const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Playlist');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playlist')
		.setDescription('See the playlist')
		.setDMPermission(false),
	async execute(client, interaction) {
		if (!interaction.member.voice.channelId) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' is not in a voice channel');
			await interaction.reply('Please join a Voice Channel first !');
		}
		else if (!client.player.get(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			log.info('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' asks the playlist');
			const playlist = client.playlist.get(interaction.guild.id);
			let msg = '```\n';

			msg += 'Playing : ' + playlist[0].metadata.title + '\n';

			for (let index = 1; index < playlist.length; index++) {
				msg += index + ' : ' + playlist[index].metadata.title + '\n';
				if (index > 9) {
					msg += 'and more ...' + '\n';
					break;
				}
			}

			msg += '```';

			log.debug(msg);

			await interaction.reply(msg);

		}
	},
};