const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

const log = require('log4js').getLogger('Leave');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave a channel'),
	async execute(client, interaction) {
		const connection = getVoiceConnection(interaction.guild.id);
		if (connection) {
			connection.destroy();
			log.info('The bot quit the channel like as demanded ' + interaction.member.user.username);
			await interaction.reply('Bye!');

		}
		else {
			log.warn('The bot is not in the channel ' + interaction.member.user.username);
			await interaction.reply('But i\'am not here !');
		}

	},
};