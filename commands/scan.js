const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const path = require('node:path');
const log = require('log4js').getLogger('Scan');
const jsmediatags = require('jsmediatags');


async function addSongToDatabase(tabSong, sequelize, forcebdd) {

	const regex = /\b(Disc|disk|DISK) \d/g;

	const Song = require('../models/song.model')(sequelize);

	const songError = new Map();

	if (forcebdd) {
		log.warn('Clearing of the database (forcebdd true)');
		await Song.sync({ force: true });
	}

	let idmax = await Song.max('song_id');

	if (idmax == null) {
		idmax = 0 ;
	}


	for (let i = 0 ; i < tabSong.length ; i++) {

		try {
			let discNumber = 0;
			const tag = await getTags(tabSong[i]);
			const pos = tabSong[i].search(regex);

			if (pos > discNumber) {
				discNumber = tabSong[i].slice(pos + 5, pos + 6);
			}

			const songdb = { song_id : idmax,
				name : tag.tags.title,
				numberTrack : tag.tags.track,
				album : tag.tags.album,
				disc : discNumber,
				artist : tag.tags.artist,
				genre : tag.tags.genre,
				year : tag.tags.year,
				path : tabSong[i],
			};

			await Song.create(songdb);

			log.info((i + 1) + '/' + tabSong.length + ' | ' + tag.tags.title + ' added !');
			idmax++;

		}
		catch (error) {
			if (typeof error.original != 'undefined' && error.original.code == 23505) {
				log.error((i + 1) + '/' + tabSong.length + ' | ' + tabSong[i] + ' is already exists !');
			}
			else {
				log.error((i + 1) + '/' + tabSong.length + ' | ' + tabSong[i] + ' problem found !');
				songError.set('Song_' + i, { path : tabSong[i] });
				log.error(error);
			}
		}
	}

	log.info('Fin de l\'ajout ! ');
	if (songError.size > 0) {
		setTimeout(() => {
			log.error('Music that has a problem with the information to be provided : ');
			log.error(songError);
		}, 3000);

	}


}

function getTags(url) {
	return new Promise((resolve, reject) => {
		new jsmediatags.Reader(url).read({
			onSuccess: (tag) => {
				resolve(tag);
			},
			onError: (error) => {
				log.error(error);
				reject(error);
			},
		});
	});
}

function getFilesFromDir(dir) {

	const fileTypes = ['.mp3', '.flac'];

	const tabSong = [];

	function walkDir(currentPath) {
		try {
			const files = fs.readdirSync(currentPath);
			for (const i in files) {

				const curFile = path.join(currentPath, files[i]);

				if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) != -1) {

					tabSong.push(curFile);

				}
				else if (fs.statSync(curFile).isDirectory()) {
					walkDir(curFile);
				}
			}
		}
		catch (error) {
			log.error('Error for this path : ' + currentPath);
			log.error(error);
		}
	}

	walkDir(dir);
	return tabSong;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription('Scan the storage !')
		.addBooleanOption(option =>
			option.setName('forcebdd')
				.setDescription('Erase the base of donnee before scan')
				.setRequired(false)),
	async execute(client, interaction) {

		const lockScan = client.database.get('lockScan');

		if (lockScan) {
			await interaction.reply('In progress !');
		}
		else {

			await interaction.reply('In progress !');

			client.database.set('lockScan', true);

			log.info('Start of folder scan ...');

			const tabSong = getFilesFromDir(process.env.PATH_MUSIC);

			if (tabSong.length == 0) {

				log.info('Scan done ! Music not found !');
				client.database.set('lockScan', false);
				await interaction.editReply('Done ! Music not found during the scan !');
			}
			else {

				log.info('Scan done ! Beginning of adding music to the database ...');

				const sequelize = client.database.get('db');

				const forcebdd = await interaction.options.getBoolean('forcebdd');

				await addSongToDatabase(tabSong, sequelize, forcebdd);

				client.database.set('lockScan', false);

				await interaction.editReply('Done !');
			}

		}

	},
};