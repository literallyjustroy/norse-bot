module.exports = {
        // Primary functionality for making Youtube music play
        async execute(message, queue, serverQueue) {

            const args = message.content.split(' ');
            const url = args[0];
    
            // YouTube audio dependency
            const ytdl = require('ytdl-core');
            
            console.log("Execute called");
            //console.log(message);
            
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
            const songInfo = await ytdl.getInfo(url);
            const song = {
                title: songInfo.title,
                message: songInfo.video_url,
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
                    this.play(message.guild, queueContruct.songs[0]);
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
            const serverQueue = this.queue.get(guild.id);
    
            if (!song) {
                serverQueue.voiceChannel.leave();
                this.queue.delete(guild.id);
                return;
            }
    
            const dispatcher = serverQueue.connection.playStream(this.ytdl(song.message))
                .on('end', () => {
                    console.log('Music ended!');
                    serverQueue.songs.shift();
                    this.play(guild, serverQueue.songs[0]);
                })
                .on('error', error => {
                    console.error(error);
                });
            dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        }
}