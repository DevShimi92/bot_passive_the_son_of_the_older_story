const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

const log = require('log4js').getLogger('Leave');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave a channel')
		.setDMPermission(false),
	async execute(client, interaction) {
		const connection = getVoiceConnection(interaction.guild.id);

		if (client.player.get(interaction.guild.id)) {
			const player = client.player.get(interaction.guild.id);
			player.stop();
			client.player.set(interaction.guild.id, undefined);
			client.playlist.set(interaction.guild.id, []);
		}

		if (connection) {
			connection.destroy();
			log.info('[ ' + interaction.member.guild.name + ' ] ' + 'The bot quit the channel like as demanded ' + interaction.member.user.username);
			await interaction.reply('Bye!');

		}
		else {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'The bot is not in the channel ' + interaction.member.user.username);
			await interaction.reply('But i\'am not here !');
		}

	},
};