const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const { stop } = require('./stop');
const log = require('log4js').getLogger('Leave');

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

async function clearStorage() {
	await delay(5000);
	log.trace('- Deleting of storage_yb');
	fs.rm('./storage_yt', { recursive: true }, (err) => {
		if (err) {
			log.error(err);
		}
		log.trace('- Done');
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave a channel')
		.setDMPermission(false),
	async execute(client, interaction) {
		const connection = getVoiceConnection(interaction.guild.id);

		if (client.player.get(interaction.guild.id) != undefined) {
			stop(client, interaction);
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