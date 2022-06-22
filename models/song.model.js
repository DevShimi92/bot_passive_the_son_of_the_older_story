const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

	const Song = sequelize.define('song', {

		song_id: {
			type: DataTypes.INTEGER,
		},
		name: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.STRING,
		},
		numberTrack: {
			type: DataTypes.STRING(5),
		},
		album: {
			type: DataTypes.STRING,
		},
		disc: {
			type: DataTypes.INTEGER,
		},
		artist: {
			type: DataTypes.STRING,
		},
		genre: {
			type: DataTypes.STRING,
		},
		year: {
			type: DataTypes.INTEGER,
		},
		picture: {
			type: DataTypes.BLOB,
		},
		path: {
			type: DataTypes.STRING,
		},
	});
	return Song;

};