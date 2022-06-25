const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, getVoiceConnection } = require('@discordjs/voice');
const log = require('log4js').getLogger('Play');
const join = require('./join');

async function randomSong(client, interaction) {

	const sequelize = client.database.get('db');
	const Song = require('../models/song.model')(sequelize);
	const idmax = await Song.max('song_id');

	if (idmax == null) {
		log.warn('Music not found in database !');
		await interaction.editReply('Music not found in database !');
		return null;
	}

	const ramdomID = Math.floor(Math.random() * idmax);

	const song = await Song.findOne({
		attributes: ['name', 'album', 'artist', 'picture', 'path'],
		raw: true,
		where: {
			song_id: ramdomID,
		},
	}).then(function(data) {
		return data ;
	});

	log.info('N° ' + ramdomID + ' : ' + song.name + ' is drawn this time');

	const resource = createAudioResource(song.path, {
		metadata: {
			title: song.name,
			album: song.album,
			artist: song.artist,
			picture: song.picture,
		},
	});

	return resource;

}

async function addSong(client, interaction, resource, reply = false) {

	if (resource == null) {
		return;
	}

	const player = client.player.get(interaction.guild.id);
	const connection = getVoiceConnection(interaction.guild.id);

	const playlist = client.playlist.get(interaction.guild.id);
	playlist.push(resource);
	client.playlist.set(interaction.guild.id, playlist);

	if (!player.checkPlayable()) {
		player.play(playlist[0]);
		connection.subscribe(player);
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'The audio player play this song : ' + resource.metadata.title);
		if (!reply) {
			await interaction.editReply('Play !');
		}
	}
	else {
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'This song as add to playlist : ' + resource.metadata.title);
		if (!reply) {
			await interaction.editReply('Song add to playlist');
		}

	}

}

async function createPlayer(client, interaction) {

	const player = createAudioPlayer();

	player.on(AudioPlayerStatus.Paused, () => {
		log.debug('[ ' + interaction.member.guild.name + ' ] ' + 'The audio player has be paused!');
		client.paused.set(interaction.guild.id, true);

	});

	player.on(AudioPlayerStatus.Playing, () => {
		log.debug('[ ' + interaction.member.guild.name + ' ] ' + 'The audio player has started playing!');
		client.paused.set(interaction.guild.id, false);
	});

	player.on(AudioPlayerStatus.Idle, () => {
		const playlist = client.playlist.get(interaction.guild.id);
		playlist.shift();
		if (playlist.length > 0) {
			log.info('[ ' + interaction.member.guild.name + ' ] ' + 'Next Song : ' + playlist[0].metadata.title);
			player.play(playlist[0]);
		}
		else {
			log.info('[ ' + interaction.member.guild.name + ' ] ' + 'End of playlist');
		}
	});

	player.on('error', error => {
		log.error('[ ' + interaction.member.guild.name + ' ] ' + `Error: ${error.message} with resource ${error.resource.metadata.title}`);
	});

	client.player.set(interaction.guild.id, player);
	const numberOfPlayer = new Number(client.player.get('numberOfPlayer'));
	client.player.set('numberOfPlayer', numberOfPlayer + 1);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a random music')
		.setDMPermission(false),
	async execute(client, interaction) {

		await interaction.deferReply();

		if (await join.connectToChannel(client, interaction) == undefined) {

			if (!client.player.get(interaction.guild.id)) {
				await createPlayer(client, interaction);
			}

			if (!client.playlist.get(interaction.guild.id)) {
				const playlist = [];
				client.playlist.set(interaction.guild.id, playlist);
			}

			log.debug('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' want one song');
			addSong(client, interaction, await randomSong(client, interaction));
		}
		else {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' is not in a voice channel');
		}

	},
	createPlayer,
	addSong,
};