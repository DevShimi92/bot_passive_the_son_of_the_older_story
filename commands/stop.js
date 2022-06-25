const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Stop');

async function stop(client, interaction) {

	const player = client.player.get(interaction.guild.id);
	await player.stop();
	client.player.set(interaction.guild.id, undefined);
	client.playlist.set(interaction.guild.id, []);
	log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music stopped by ' + interaction.member.user.username);
	const numberOfPlayer = new Number(client.player.get('numberOfPlayer'));
	if (numberOfPlayer > 0) {
		client.player.set('numberOfPlayer', numberOfPlayer - 1);
	}

}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the music')
		.setDMPermission(false),
	async execute(client, interaction) {

		if (!client.player.get(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			stop(client, interaction);
			await interaction.reply('Music stopped !');
		}

	},
	stop,
};