const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, AudioPlayerStatus, entersState, joinVoiceChannel, createAudioResource, createAudioPlayer, getVoiceConnection } = require('@discordjs/voice');
const log = require('log4js').getLogger('Play');

async function randomSong(client) {

	const sequelize = client.database.get('db');
	const Song = require('../models/song.model')(sequelize);
	const idmax = await Song.max('song_id');

	if (isNaN(idmax)) {
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

async function addSong(client, resource, interaction) {

	const player = client.music.get('player');
	const connection = getVoiceConnection(interaction.guild.id);

	const playlist = client.music.get('playlist');
	playlist.push(resource);
	client.music.set('playlist', playlist);

	if (!player.checkPlayable()) {
		player.play(playlist[0]);
		connection.subscribe(player);
		log.info('The audio player play this song : ' + resource.metadata.title);
		await interaction.editReply('Play !');
	}
	else {
		log.info('This song as add to playlist : ' + resource.metadata.title);
		await interaction.editReply('Song add to playlist');
	}

}

async function connectToChannel(client, interaction) {

	const channel = interaction.member.voice.channel;

	if (!interaction.member.voice.channelId) {
		await interaction.reply('Please join a Voice Channel first !');
		return;
	}

	const newConnection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	newConnection.on(VoiceConnectionStatus.Ready, () => {
		log.info('The bot join the channel for play a music like as demanded ' + interaction.member.user.username);
	});

	newConnection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(newConnection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(newConnection, VoiceConnectionStatus.Connecting, 5_000),
			]);
			// Seems to be reconnecting to a new channel - ignore disconnect
		}
		catch (error) {
			// Seems to be a real disconnect which SHOULDN'T be recovered from
			newConnection.destroy();
		}
	});

	newConnection.on(VoiceConnectionStatus.Destroyed, () => {
		// try to delete the queue
		if (client.queues) {
			client.queues.delete(channel.guild.id);
		}
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a random music')
		.setDMPermission(false),
	async execute(client, interaction) {

		if (!client.music.get('player')) {

			const player = createAudioPlayer();

			player.on(AudioPlayerStatus.Paused, () => {
				log.debug('The audio player has be paused!');
				client.music.set('paused', true);

			});

			player.on(AudioPlayerStatus.Playing, () => {
				log.debug('The audio player has started playing!');
				client.music.set('paused', false);
			});

			player.on(AudioPlayerStatus.Idle, () => {
				const playlist = client.music.get('playlist');
				playlist.shift();
				if (playlist.length > 0) {
					log.info('Next Song : ' + playlist[0].metadata.title);
					player.play(playlist[0]);
				}
				else {
					log.info('End of playlist');
				}
			});

			player.on('error', error => {
				log.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
			});

			client.music.set('player', player);

		}

		if (client.music.get('playlist') == undefined) {
			const playlist = [];
			client.music.set('playlist', playlist);
		}

		if (!getVoiceConnection(interaction.guild.id)) {
			await connectToChannel(client, interaction);
		}

		if (!getVoiceConnection(interaction.guild.id)) {
			log.warn(interaction.member.user.username + ' is not in a voice channel');
		}
		else {
			await interaction.deferReply();
			log.debug(interaction.member.user.username + ' want one song');
			addSong(client, await randomSong(client), interaction);
		}

	},
};