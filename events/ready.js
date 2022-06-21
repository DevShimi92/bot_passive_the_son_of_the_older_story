const log = require('log4js').getLogger('Event');
const logdb = require('log4js').getLogger('Sequelize');

function authenticationsSequelize(client) {

	const sequelize = client.database.get('db');

	sequelize.authenticate().then(() => {
		logdb.info('Connection to the base successful !');

	}).catch(err => {
		logdb.error('Error while connecting to the database !');
		logdb.error(err);
	});

	const modelDefiners = [
		require('../models/song.model'),
	];

	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize);
	}

	sequelize.sync().then(() => {
		logdb.info('Database synchronization successful !');

	}).catch(err => {
		logdb.error('Error during database synchronization !');
		logdb.error(err);
	});

}

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		authenticationsSequelize(client);
		log.info(`Ready! Logged in as ${client.user.tag}`);
	},
};
