const { ActivityType } = require('discord.js');
const client = require('..');
const chalk = require('chalk');
const { oneGP } = require('../events/backendMagic.js');
const { saveLocalDB } = require('../events/storeLocalDb.js');


client.on("ready", () => {
	const activities = [
		{ name: `${client.guilds.cache.size} Servers`, type: ActivityType.Listening },
		{ name: `${client.channels.cache.size} Channels`, type: ActivityType.Playing },
		{ name: `${client.users.cache.size} Users`, type: ActivityType.Watching },
		{ name: `Discord.js v14`, type: ActivityType.Competing }
	];
	const status = [
		'online',
		'dnd',
		'idle'
	];
	const oneGpChannel = client.channels.cache.get('1186319879532453998');

	let i = 0;
	setInterval(() => {
		if(i >= activities.length) i = 0
		client.user.setActivity(activities[i])
		i++;
	}, 5000);

	let s = 0;
	setInterval(() => {
		if(s >= activities.length) s = 0
		client.user.setStatus(status[s])
		s++;
	}, 30000);
	setInterval(() => {
	oneGP(oneGpChannel);
	}, 20000);
	setInterval(() => {
		saveLocalDB();
		}, 21000);
	console.log(chalk.red(`Logged in as ${client.user.tag}!`))
});