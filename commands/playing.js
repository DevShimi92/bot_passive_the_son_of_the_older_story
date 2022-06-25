const { MessageAttachment, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('log4js').getLogger('Playing');

function str_pad_left(string, pad, length) {
	return (new Array(length + 1).join(pad) + string).slice(-length);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playing')
		.setDescription('See what is playing')
		.setDMPermission(false),
	async execute(client, interaction) {
		if (!interaction.member.voice.channelId) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' is not in a voice channel');
			await interaction.reply('Please join a Voice Channel first !');
		}
		else if (!client.player.get(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Don\'t have player of music setted. Mistake of ' + interaction.member.user.username + ' ?');
			await interaction.reply('I already play a song ?');
		}
		else {
			log.info('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' asks what is playing currently');
			const player = client.player.get(interaction.guild.id);
			const data = player._state.resource.metadata;
			const file = new MessageAttachment(data.picture, 'image.png');
			let playingEmbed;
			const minutes = Math.floor(data.duration / 60);
			const seconds = data.duration - minutes * 60;

			if (data.album == 'Youtube') {
				playingEmbed = new MessageEmbed()
					.setColor('#ff7f00')
					.setTitle(data.title)
					.setURL(data.urlVideo)
					.setAuthor({ name: data.artist, url: data.urlChannel })
					.setDescription('From ' + data.album)
					.addField('Duration : ', minutes + ':' + str_pad_left(seconds, '0', 2), false)
					.setThumbnail('attachment://image.png')
					.setImage(data.ytPicture)
					.setFooter({ text: 'Requested by ' + data.userAskedThis, iconURL: data.pictureProfileUser });

			}
			else {
				playingEmbed = new MessageEmbed()
					.setColor('#ff7f00')
					.setTitle(data.title)
					.setAuthor({ name: data.artist })
					.setDescription('From ' + data.album)
					.setThumbnail('attachment://image.png');
			}

			await interaction.reply({ embeds: [playingEmbed], files: [file] });

		}
	},
};