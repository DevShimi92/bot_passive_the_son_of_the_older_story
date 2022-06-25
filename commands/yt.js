const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource } = require('@discordjs/voice');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const log = require('log4js').getLogger('yt');
const join = require('./join');
const play = require('./play');

function checkDirIfNotCreateDir() {

	if (!fs.existsSync('./storage_yt')) {
		log.trace('- Storage_yt folder not present. Creation in progress ...');
		fs.mkdirSync('./storage_yt');
		log.trace('- Done !');
	}

}

async function addYtbSong(interaction, url) {

	checkDirIfNotCreateDir();

	const data = await ytdl.getInfo(url);

	const pathAndNameMusicFile = './storage_yt/' + data.videoDetails.author.id + data.videoDetails.videoId + '.mp4';

	try {
		if (fs.existsSync(pathAndNameMusicFile)) {
			log.info('- Music already download');
		}
		else {
			log.info('- Download of ' + data.videoDetails.title + ' ...');
			ytdl.downloadFromInfo(data, { filter : 'audioonly', quality: '140' }).pipe(fs.createWriteStream(pathAndNameMusicFile));
			log.info('- Done !');
		}
	}
	catch (err) {
		log.error('- Error during download from this link :  ' + url);
		log.error(err);
		return null;
	}

	const resource = createAudioResource(pathAndNameMusicFile, {
		metadata: {
			title: data.videoDetails.title,
			album: 'Youtube',
			artist: data.videoDetails.author.name,
			picture: data.videoDetails.author.thumbnails[data.videoDetails.author.thumbnails.length - 1].url,
			urlChannel : data.videoDetails.author.channel_url,
			urlVideo: url,
			ytPicture: data.videoDetails.thumbnails[data.videoDetails.thumbnails.length - 1].url,
			userAskedThis: interaction.user.username,
			pictureProfileUser:interaction.user.displayAvatarURL(),
			duration: data.videoDetails.lengthSeconds,
		},
	});

	return resource;

}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('play-yt')
		.setDescription('Play something from youtube')
		.addStringOption(option =>
			option.setName('url')
				.setDescription('URL Youtube')
				.setRequired(true)),
	async execute(client, interaction) {

		await interaction.deferReply();

		if (await join.connectToChannel(client, interaction, false) == undefined) {

			const url = interaction.options.getString('url');
			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
			const songRegex = /^.*(watch\?v=)([^#\\&\\?]*).*/gi;
			const playlistRegex = /^.*(list=)([^#\\&\\?]*).*/gi;

			log.trace('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' want to play this link : ' + url);

			if (url.match(youtubRegex) && url.match(songRegex)) {

				const resource = await addYtbSong(interaction, url);

				if (!client.player.get(interaction.guild.id)) {
					await play.createPlayer(client, interaction);
				}

				if (!client.playlist.get(interaction.guild.id)) {
					const playlist = [];
					client.playlist.set(interaction.guild.id, playlist);
				}

				play.addSong(client, interaction, resource);

			}
			else if (url.match(youtubRegex) && url.match(playlistRegex)) {
				const playlistYt = await ytpl(url);

				await interaction.editReply('Adding the current playlist ...');

				if (!client.player.get(interaction.guild.id)) {
					await play.createPlayer(client, interaction);
				}

				if (!client.playlist.get(interaction.guild.id)) {
					const playlist = [];
					client.playlist.set(interaction.guild.id, playlist);
				}

				for (let index = 0; index < playlistYt.items.length; index++) {
					const resource = await addYtbSong(interaction, playlistYt.items[index].shortUrl);
					play.addSong(client, interaction, resource, true);
				}

				await interaction.editReply('Playlist added !');

			}
			else {
				log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'But this is not a link youtube ' + interaction.member.user.username);
				await interaction.editReply('Link youtube of one video only please!');
			}
		}

	},
};