const { readData, writeData } = require('./dataManager');

class AutoPostScheduler {
    constructor(client) {
        this.client = client;
        this.interval = null;
    }

    start() {
        if (this.interval) {
            this.stop();
        }

        console.log('🔄 Starting auto-post scheduler...');
        
        // Run immediately, then every minute
        this.checkAndPost();
        this.interval = setInterval(() => {
            this.checkAndPost();
        }, 60000); // 60 seconds = 1 minute
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('⏹️ Auto-post scheduler stopped');
        }
    }

    async checkAndPost() {
        try {
            const data = readData();
            if (!data.autoposting) return;

            for (const [guildId, config] of Object.entries(data.autoposting)) {
                if (!config.enabled || !config.channelId || !config.messages || config.messages.length === 0) {
                    continue;
                }

                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(config.channelId);
                if (!channel || !channel.isTextBased()) continue;

                // Get current message
                const currentMessage = config.messages[config.currentIndex];
                if (!currentMessage) continue;

                try {
                    await channel.send(currentMessage);
                    console.log(`📤 Auto-posted message to ${guild.name} #${channel.name}: "${currentMessage.substring(0, 50)}..."`);
                } catch (sendError) {
                    console.error(`❌ Failed to send auto-post message to ${guild.name}:`, sendError.message);
                }

                // Move to next message
                config.currentIndex = (config.currentIndex + 1) % config.messages.length;
            }

            // Save updated indices
            writeData(data);

        } catch (error) {
            console.error('❌ Error in auto-post scheduler:', error);
        }
    }
}

module.exports = AutoPostScheduler;