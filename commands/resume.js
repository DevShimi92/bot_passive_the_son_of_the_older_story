const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Resume');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume a song')
		.setDMPermission(false),
	async execute(client, interaction) {
		if (!client.music.get('player')) {
			log.warn('Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			const player = client.music.get('player');
			const pause = client.music.get('paused');

			if (!pause) {
				player.pause();
				log.info('Music Paused by ' + interaction.member.user.username);
				await interaction.reply('Pause!');

			}
			else {
				player.unpause();
				log.info('Music resumed by ' + interaction.member.user.username);
				await interaction.reply('Play!');
			}
		}
	},
};