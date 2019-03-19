const LenoxCommand = require('../LenoxCommand.js');
const moment = require('moment');
require('moment-duration-format');
const Discord = require('discord.js');
const ms = require('ms');

module.exports = class jobCommand extends LenoxCommand {
	constructor(client) {
		super(client, {
			name: 'job',
			group: 'currency',
			memberName: 'job',
			description: 'A full list of available jobs you can accept to earn credits',
			format: 'job',
			aliases: [],
			examples: ['job'],
			clientpermissions: ['SEND_MESSAGES'],
			userpermissions: [],
			shortDescription: 'Games',
			dashboardsettings: true
		});
	}

	async run(msg) {
		const langSet = msg.client.provider.getGuild(msg.message.guild.id, 'language');
		const lang = require(`../../languages/${langSet}.json`);

		if (msg.client.provider.getUser(msg.author.id, 'jobstatus') === true) {
			const timestamps = msg.client.provider.getBotsettings('botconfs', 'cooldowns');
			delete timestamps.job[msg.author.id];
			await msg.client.provider.setBotsettings('botconfs', 'cooldowns', timestamps);
			return msg.reply(lang.job_error);
		}

		const jobslist = [
			['farmer', 240, Math.floor(Math.random() * 400) + 100, 'tractor', 'https://imgur.com/1PVI8hM.png'],
			['technician', 90, Math.floor(Math.random() * 150) + 75, 'hammer', 'https://imgur.com/yQmaFIe.png'],
			['trainer', 90, Math.floor(Math.random() * 150) + 75, 'football', 'https://imgur.com/bRqzmKw.png'],
			['applespicker', 1, Math.floor(Math.random() * 10) + 3, 'undefined', 'https://imgur.com/qv4iev8.png'],
			['professor', 60, Math.floor(Math.random() * 50) + 25, 'book', 'https://imgur.com/YUc7Ppb.png'],
			['baker', 30, Math.floor(Math.random() * 25) + 15, 'undefined', 'https://imgur.com/HRdvO6r.png'],
			['taxidriver', 240, Math.floor(Math.random() * 400) + 200, 'car', 'https://imgur.com/uOMpS17.png'],
			['paramedic', 180, Math.floor(Math.random() * 300) + 150, 'syringe', 'https://imgur.com/Z97fWoc.png'],
			['police', 180, Math.floor(Math.random() * 300) + 150, 'gun', 'https://imgur.com/HQXp8R8.png'],
			['chef', 120, Math.floor(Math.random() * 200) + 60, 'knife', 'https://imgur.com/F940PkL.png']
		];

		let index = 0;

		const embed = new Discord.RichEmbed()
			.setColor('#66ff66')
			.setFooter(lang.job_embed)
			.setAuthor(lang.job_available);

		for (let i = 0; i < jobslist.length; i++) {
			embed.addField(`${++index}. ${lang[`job_${jobslist[i][0]}title`]} (${moment.duration(jobslist[i][1], 'minutes').format(`d[ ${lang.messageevent_days}], h[ ${lang.messageevent_hours}], m[ ${lang.messageevent_minutes}] s[ ${lang.messageevent_seconds}]`)})`, `${lang[`job_${jobslist[i][0]}description`]}`);
		}

		msg.channel.send({
			embed
		});

		let response;
		try {
			response = await msg.channel.awaitMessages(msg2 => msg.author.id === msg2.author.id, {
				maxMatches: 1,
				time: 60000,
				errors: ['time']
			});
		} catch (error) {
			return msg.reply(lang.job_timeerror);
		}

		if (isNaN(response.first().content)) return msg.reply(lang.job_nonumberror);
		if (response.first().content >= (jobslist.length + 1)) return msg.reply(lang.job_wrongnumber);
		if (response.first().content <= 0) return msg.reply(lang.job_wrongnumber);

		if (jobslist[response.first().content - 1][3] !== 'undefined') {
			const notenough = lang.job_notenough.replace('%item', `\`${jobslist[response.first().content - 1][3]}\``);
			if (!msg.client.provider.getUser(msg.author.id, 'inventory')[jobslist[response.first().content - 1][3]] >= 1) {
				const timestamps = msg.client.provider.getBotsettings('botconfs', 'cooldowns');
				delete timestamps.job[msg.author.id];
				await msg.client.provider.setBotsettings('botconfs', 'cooldowns', timestamps);
				return msg.reply(notenough);
			}
		}

		const job = lang[`job_${jobslist[response.first().content - 1][0]}title`];
		const jobtime = jobslist[response.first().content - 1][1];
		const amount = jobslist[response.first().content - 1][2];
		const jobpicture = jobslist[response.first().content - 1][4];

		let currentjobstatus = msg.client.provider.getUser(msg.author.id, 'jobstatus');
		currentjobstatus = true;
		await msg.client.provider.setUser(msg.author.id, 'jobstatus', currentjobstatus);

		const duration = lang.job_duration.replace('%duration', jobtime);

		const embed2 = new Discord.RichEmbed()
			.setColor('#66ff33')
			.setTitle(job)
			.setDescription(`${lang.job_sentmessage} \n\n${duration}`)
			.setThumbnail(jobpicture);
		await msg.channel.send({
			embed: embed2
		});

		const currentJobreminder = msg.client.provider.getBotsettings('botconfs', 'jobreminder');
		currentJobreminder[msg.author.id] = {
			userID: msg.author.id,
			remind: Date.now() + ms(`${jobtime}m`),
			amount: amount,
			job: job,
			jobtime: jobtime,
			discordServerID: msg.guild.id,
			channelID: msg.channel.id
		};
		await msg.client.provider.setBotsettings('botconfs', 'jobreminder', currentJobreminder);

		const activityEmbed = new Discord.RichEmbed()
			.setAuthor(`${msg.author.tag} (${msg.author.id})`, msg.author.displayAvatarURL)
			.setDescription(`**Job:** ${job} \n**Duration:** ${jobtime} minutes \n**Amount:** ${amount} credits`)
			.addField('Guild', `${msg.guild.name} (${msg.guild.id})`)
			.addField('Channel', `${msg.channel.name} (${msg.channel.id})`)
			.setColor('AQUA')
			.setFooter('JOB STARTED')
			.setTimestamp();
		if (msg.client.provider.getBotsettings('botconfs', 'activity') === true) {
			const messagechannel = msg.client.channels.get(msg.client.provider.getBotsettings('botconfs', 'activitychannel'));
			messagechannel.send({
				embed: activityEmbed
			});
		}

		setTimeout(async () => {
			let newCurrentjobstatus = msg.client.provider.getUser(msg.author.id, 'jobstatus');
			newCurrentjobstatus = false;
			await msg.client.provider.setUser(msg.author.id, 'jobstatus', newCurrentjobstatus);

			const newCurrentJobreminder = msg.client.provider.getBotsettings('botconfs', 'jobreminder');
			delete newCurrentJobreminder[msg.author.id];
			await msg.client.provider.setBotsettings('botconfs', 'jobreminder', newCurrentJobreminder);

			let currentCredits = msg.client.provider.getUser(msg.author.id, 'credits');
			currentCredits += amount;
			await msg.client.provider.setUser(msg.author.id, 'credits', currentCredits);

			const jobfinish = `Congratulations! You have successfully completed your job. You earned a total of ${amount} credits`;
			msg.member.send(jobfinish);

			const activityEmbed2 = new Discord.RichEmbed()
				.setAuthor(`${msg.author.tag} (${msg.author.id})`, msg.author.displayAvatarURL)
				.setDescription(`**Job:** ${job} \n**Duration:** ${jobtime} minutes \n**Amount:** ${amount} credits`)
				.addField('Guild', `${msg.guild.name} (${msg.guild.id})`)
				.addField('Channel', `${msg.channel.name} (${msg.channel.id})`)
				.setColor('AQUA')
				.setFooter('JOB FINISHED')
				.setTimestamp();
			if (msg.client.provider.getBotsettings('botconfs', 'activity') === true) {
				const messagechannel = msg.client.channels.get(msg.client.provider.getBotsettings('botconfs', 'activitychannel'));
				messagechannel.send({
					embed: activityEmbed2
				});
			}
		}, ms(`${jobtime}m`));
	}
};
