const { MessageAttachment, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Playing');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playing')
		.setDescription('See what is playing')
		.setDMPermission(false),
	async execute(client, interaction) {
		if (!interaction.member.voice.channelId) {
			log.warn(interaction.member.user.username + ' is not in a voice channel');
			await interaction.reply('Please join a Voice Channel first !');
		}
		else if (!client.music.get('player')) {
			log.warn('Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			log.info(interaction.member.user.username + ' asks what is playing currently');
			const player = client.music.get('player');
			const data = player._state.resource.metadata;
			const file = new MessageAttachment(data.picture, 'image.png');

			const playingEmbed = new MessageEmbed()
				.setColor('#ff7f00')
				.setTitle(data.title)
				.setAuthor({ name: data.artist })
				.setDescription('From ' + data.album)
				.setThumbnail('attachment://image.png');

			await interaction.reply({ embeds: [playingEmbed], files: [file] });

		}
	},
};