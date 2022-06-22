const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Stop');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the music')
		.setDMPermission(false),
	async execute(client, interaction) {

		if (!client.music.get('player')) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			const player = client.player.get(interaction.guild.id);
			player.stop();
			client.player.set('player', undefined);
			client.playlist.set('playlist', []);
			log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music stopped by ' + interaction.member.user.username);
			await interaction.reply('Music stopped !');
		}

	},
};