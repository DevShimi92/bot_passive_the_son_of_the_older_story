const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, entersState, getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const log = require('log4js').getLogger('Join');


async function connectToChannel(client, interaction, cmdOnly) {

	const channel = interaction.member.voice.channel;

	if (!interaction.member.voice.channelId) {
		log.warn('[ ' + interaction.member.guild.name + ' ] ' + interaction.member.user.username + ' is not in a voice channel');
		await interaction.editReply('Please join a Voice Channel first !');
		return false;
	}

	const connection = getVoiceConnection(interaction.guild.id);

	if (connection) {
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'The bot is already in the channel ' + interaction.member.user.username);
		if (cmdOnly) {
			await interaction.editReply('Already connected');
		}
	}
	const newConnection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	newConnection.on(VoiceConnectionStatus.Ready, () => {
		log.info('[ ' + interaction.member.guild.name + ' ] ' + 'The bot join the channel like as demanded ' + interaction.member.user.username);
		if (cmdOnly) {
			interaction.editReply('I\'am on the channel !');
		}
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
		.setName('join')
		.setDescription('Join a channel')
		.setDMPermission(false),
	async execute(client, interaction) {
		await interaction.deferReply();
		await connectToChannel(client, interaction, true);
	},
	connectToChannel,
};
