const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, AudioPlayerStatus, entersState, joinVoiceChannel, createAudioResource, createAudioPlayer, getVoiceConnection } = require('@discordjs/voice');
const log = require('log4js').getLogger('Play');

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

async function addSong(client, resource, interaction) {

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
		await interaction.editReply('Play !');
	}
	else {
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'This song as add to playlist : ' + resource.metadata.title);
		await interaction.editReply('Song add to playlist');
	}

}

async function connectToChannel(client, interaction) {

	const channel = interaction.member.voice.channel;

	if (!interaction.member.voice.channelId) {
		await interaction.editReply('Please join a Voice Channel first !');
		return;
	}

	const newConnection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	newConnection.on(VoiceConnectionStatus.Ready, () => {
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'The bot join the channel for play a music like as demanded ' + interaction.member.user.username);
	});

	newConnection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + 'Disconnected! Attempt to reconnect ...');
			await Promise.race([
				entersState(newConnection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(newConnection, VoiceConnectionStatus.Connecting, 5_000),
			]);
		}
		catch (error) {
			log.error('[ ' + interaction.member.guild.name + ' ] ' + 'For some unknown reason, connection lost !');
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

		await interaction.deferReply();

		if (!getVoiceConnection(interaction.guild.id)) {
			await connectToChannel(client, interaction);
		}

		if (!getVoiceConnection(interaction.guild.id)) {
			log.warn('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' is not in a voice channel');
		}
		else {

			if (!client.player.get(interaction.guild.id)) {

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

			}

			if (!client.playlist.get(interaction.guild.id)) {
				const playlist = [];
				client.playlist.set(interaction.guild.id, playlist);
			}


			log.debug('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' want one song');
			addSong(client, await randomSong(client, interaction), interaction);
		}

	},
};