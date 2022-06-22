const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('skip');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip a song')
		.setDMPermission(false),
	async execute(client, interaction) {

		if (!client.music.get('player')) {
			log.warn('Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			log.info('Music skiped by ' + interaction.member.user.username);
			const player = client.music.get('player');
			const playlist = client.music.get('playlist');
			playlist.shift();
			if (playlist.length > 0) {
				log.info('Next Song : ' + playlist[0].metadata.title);
				player.play(playlist[0]);
			}
			else {
				log.info('End of playlist');
				player.stop();
				client.music.set('player', undefined);
				client.music.set('playlist', []);
				log.info('Music stopped');
			}
			await interaction.reply('Skip!');
		}
	},
};