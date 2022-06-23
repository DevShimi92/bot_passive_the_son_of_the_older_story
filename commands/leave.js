const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const log = require('log4js').getLogger('Leave');

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave a channel')
		.setDMPermission(false),
	async execute(client, interaction) {
		const connection = getVoiceConnection(interaction.guild.id);

		if (client.player.get(interaction.guild.id) != undefined) {
			const player = client.player.get(interaction.guild.id);
			player.stop();
			client.player.set(interaction.guild.id, undefined);
			client.playlist.set(interaction.guild.id, []);
			const numberOfPlayer = new Number(client.player.get('numberOfPlayer'));
			if (numberOfPlayer > 0) {
				client.player.set('numberOfPlayer', numberOfPlayer - 1);
			}
		}

		if (client.player.get('numberOfPlayer') == 0) {
			await delay(1000);
			log.trace('Deleting of storage_yb');
			fs.rmSync('./storage_yt/', { recursive: true, force: true });
			log.trace('Done');
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