const { SlashCommandBuilder } = require('@discordjs/builders');
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

async function addYtbSong(interaction, url, lengthPlaylist) {

	checkDirIfNotCreateDir();

	let data ;

	try {
		data = await ytdl.getInfo(url);
	}
	catch (error) {
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Error with this link : ' + url);
		log.error(error);
		return null;
	}

	if (data.player_response.playabilityStatus.status != 'OK') {
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Error : ' + data.videoDetails.title + ' is not playlable for this reason :  ' + data.player_response.playabilityStatus.reason);
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Url : ' + url);
		return null;
	}
	else if (data.videoDetails.liveBroadcastDetails?.isLiveNow) {
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Error : ' + data.videoDetails.title + ' is not playlable beacause is a stream');
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Url : ' + url);
		return null;
	}

	let quality = 250;
	let container = '.webm';

	try {
		ytdl.chooseFormat(data.formats, { quality: '250' });
	}
	catch (error) {
		quality = 'highestaudio' ;
		container = '.mp4';
	}

	const metadata = {
		title: data.videoDetails.title,
		container: container,
		album: 'Youtube',
		artist: data.videoDetails.author.name,
		picture: data.videoDetails.author.thumbnails[data.videoDetails.author.thumbnails.length - 1].url,
		urlChannel : data.videoDetails.author.channel_url,
		urlVideo: url,
		ytPicture: data.videoDetails.thumbnails[data.videoDetails.thumbnails.length - 1].url,
		userAskedThis: interaction.user.username,
		pictureProfileUser:interaction.user.displayAvatarURL(),
		duration: data.videoDetails.lengthSeconds,
	};

	const pathAndNameMusicFile = './storage_yt/' + data.videoDetails.author.id + data.videoDetails.videoId + container;

	try {
		if (fs.existsSync(pathAndNameMusicFile)) {
			log.info('- Music already download');

			const resource = { path : pathAndNameMusicFile, metadata: metadata };

			return resource;
		}
		else {
			log.info('- Download of ' + data.videoDetails.title + ' ...');

			if (lengthPlaylist == 0) {

				log.trace('- Cached Music');

				const opusStream = ytdl.downloadFromInfo(data, { filter : 'audioonly', dlChunkSize: 0, quality: quality, highWaterMark : 1 << 30 });

				const resource = { path : opusStream, metadata: metadata };

				log.info('- Done !');

				return resource;

			}
			else {

				ytdl.downloadFromInfo(data, { filter : 'audioonly', dlChunkSize: 0, quality: quality, highWaterMark : 1 << 30 }).pipe(fs.createWriteStream(pathAndNameMusicFile));

				const resource = { path : pathAndNameMusicFile, metadata: metadata };

				log.info('- Done !');

				return resource;

			}

		}
	}
	catch (err) {
		log.error('[ ' + interaction.member.guild.name + ' ] ' + 'Error during download from this link :  ' + url);
		log.error(err);
		return null;
	}

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

		let msg;

		await interaction.deferReply();

		if (await join.connectToChannel(client, interaction, false) == undefined) {

			const url = interaction.options.getString('url');
			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
			const playlistRegex = /^.*(list=)([^#\\&\\?]*).*/gi;

			log.trace('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' want to play this link : ' + url);

			if (url.match(youtubRegex) && url.match(playlistRegex)) {

				const playlistYt = await ytpl(url);

				await interaction.editReply('Adding the current playlist ...');

				if (!client.playlist.get(interaction.guild.id)) {
					const playlist = [];
					client.playlist.set(interaction.guild.id, playlist);
				}

				for (let index = 0; index < playlistYt.items.length; index++) {
					const resource = await addYtbSong(interaction, playlistYt.items[index].shortUrl, client.playlist.get(interaction.guild.id).length);
					await play.addSong(client, interaction, resource, true);
				}

				await interaction.editReply('Playlist added !');

			}
			else if (url.match(youtubRegex)) {

				if (!client.playlist.get(interaction.guild.id)) {
					const playlist = [];
					client.playlist.set(interaction.guild.id, playlist);
				}

				const resource = await addYtbSong(interaction, url, client.playlist.get(interaction.guild.id).length);

				if (resource == null) {
					msg = 'Can\'t get a video from this link !';
				}

				play.addSong(client, interaction, resource, msg);

			}
			else {
				log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'But this is not a link youtube ' + interaction.member.user.username);
				await interaction.editReply('Link youtube of one video only please!');
			}
		}

	},
};