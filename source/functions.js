const logger = require('winston');
const request = require('request-promise-native');
// Configure logger settings

module.exports = {
    /** Adds two numbers together from given arguments */
    add(args) {
        let response = 'Must add 2 numbers (Ex: "!add 1 2)"';
            if (args.length === 2) {
            const num1 = Number(args[0]);
            const num2 = Number(args[1]);
            logger.debug(`1: [${num1}], 2: [${num2}]`);

            if (isNaN(num1) || isNaN(num2)) { // if either is not NotANumber
                response = 'Arguments must be numbers'; // Should really throw an error which is caught in bots.js
            } else {
                response = num1 + num2;
            }
        }
        return response;
    },

    async randomImage(args) {
        let response = `Must provide at least 1 search term (Ex: !get nku esports)`;
        if (args.length > 0) {
            response = `Error getting requested image`;
            const keyword = encodeURI(args.join(' ')); // combines arguments for multi-worded search
            let numPhotos = 100;  
            let options = {
                uri: `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=0c748ca30b04100a36deb13f12b3c1d3&tags=${keyword}&sort=relevance&per_page=100&format=json&nojsoncallback=1`,
                json: true
            };
            logger.debug(options);
            await request(options).then(json => {
                if (json.photos.photo.length === 0)
                    response = 'Search returned no results';
                else {
                    numPhotos = json.photos.photo.length; // reset incase less photos are available

                    const photoIndex = Math.floor(Math.random() * Math.floor(numPhotos)); // Random int less than num photos
                    
                    const photo = json.photos.photo[photoIndex];
                    response = `http://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
                    logger.debug(response);
                }
            }).catch( err => {
                logger.debug(err);
            });
        }
        return response;
    },

    // Primary functionality for making Youtube music play
    async execute(message, serverQueue) {
        const args = message.content.split(' ');

        const voiceChannel = message.member.voiceChannel;
        const permissions = voiceChannel.permissionsFor(message.client.user);

        // Checking to make sure that the user is in a voice channel
        if (!voiceChannel) {
            return message.channel.send('You need to be in a voice channel to play music!');
        }

        // Checking to make sure that the bot has the correct permissions
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('I need the permissions to join and speak in your voice channel!');
        }

        // Obtaining the song's info and making a song object
        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
            length: songInfo.lengthSeconds,	// undefined? ended after 2m 38s
        };

        console.log(song);

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true,
            };

            queue.set(message.guild.id, queueContruct);

            queueContruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }
            
        } else {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return message.channel.send(`${song.title} has been added to the queue!`);
        }

    },

    // Youtube Music Functionality
    skip(message, serverQueue) {
        if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
        if (!serverQueue) return message.channel.send('There is no song that I could skip!');
        serverQueue.connection.dispatcher.end();
    },

    stop(message, serverQueue) {
        if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    },

    play(guild, song) {
        const serverQueue = queue.get(guild.id);

        if (!song) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }

        const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', () => {
                console.log('Music ended!');
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            .on('error', error => {
                console.error(error);
            });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }


//   isNKUStudent(firstName, lastName) {
//     // Check directory.nku.edu/student and check if the last/name combo returns any students
//   },
};
