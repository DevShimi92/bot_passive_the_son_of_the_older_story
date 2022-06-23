const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Resume');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Pause/Resume a song')
		.setDMPermission(false),
	async execute(client, interaction) {
		if (!client.player.get(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			const player = client.player.get(interaction.guild.id);
			const pause = client.paused.get(interaction.guild.id);

			if (!pause) {
				player.pause();
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music Paused by ' + interaction.member.user.username);
				await interaction.reply('Pause!');

			}
			else {
				player.unpause();
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music resumed by ' + interaction.member.user.username);
				await interaction.reply('Play!');
			}
		}
	},
};