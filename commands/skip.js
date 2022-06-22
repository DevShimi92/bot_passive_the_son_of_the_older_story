const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('skip');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip a song')
		.setDMPermission(false),
	async execute(client, interaction) {

		if (!client.player.get(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music skiped by ' + interaction.member.user.username);
			const player = client.player.get(interaction.guild.id);
			const playlist = client.playlist.get(interaction.guild.id);
			playlist.shift();
			if (playlist.length > 0) {
				log.info('Next Song : ' + playlist[0].metadata.title);
				player.play(playlist[0]);
			}
			else {
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'End of playlist');
				player.stop();
				client.player.set('player', undefined);
				client.playlist.set('playlist', []);
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music stopped');
			}
			await interaction.reply('Skip!');
		}
	},
};