const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, StreamType } = require('@discordjs/voice');

const log = require('log4js').getLogger('Skip');

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
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Next Song : ' + playlist[0].metadata.title);
				let AudioResource;
				if (playlist[0].metadata.album == 'Youtube') {
					let inputType = StreamType.WebmOpus;
					if (playlist[0].metadata.container == '.mp4') { inputType = StreamType.Arbitrary; }
					AudioResource = createAudioResource(playlist[0].path, { inputType: inputType, metadata : playlist[0].metadata });
				}
				else {
					AudioResource = createAudioResource(playlist[0].path, { metadata : playlist[0].metadata });
				}
				player.play(AudioResource);
			}
			else {
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'End of playlist');
				player.stop();
				client.player.set(interaction.guild.id, undefined);
				client.playlist.set(interaction.guild.id, []);
				log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Music stopped');
				const numberOfPlayer = new Number(client.player.get('numberOfPlayer'));
				if (numberOfPlayer > 0) {
					client.player.set('numberOfPlayer', numberOfPlayer - 1);
				}
			}
			await interaction.reply('Skip!');
		}
	},
};