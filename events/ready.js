const log = require('log4js').getLogger('Event');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		log.info(`Ready! Logged in as ${client.user.tag}`);
	},
};