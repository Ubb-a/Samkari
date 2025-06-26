const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { readData, writeData } = require('../utils/dataManager');

module.exports = {
    name: 'autopost',
    description: 'Setup automatic posting of different messages every minute to a specific channel',
    usage: 'autopost <channel_id> <message1> | <message2> | <message3> ... OR autopost stop',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to setup auto posting.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Arguments')
                    .setDescription('**Usage:**\n`autopost <channel_id> <message1> | <message2> | <message3>`\n`autopost stop` - Stop auto posting\n\n**Example:** `autopost 123456789 Hello! | How are you? | Good morning!`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if stopping auto posting
            if (args[0].toLowerCase() === 'stop') {
                const data = readData();
                if (!data.autoposting) data.autoposting = {};
                
                data.autoposting[message.guild.id] = {
                    enabled: false,
                    channelId: null,
                    messages: [],
                    currentIndex: 0
                };
                
                writeData(data);
                
                const successEmbed = new EmbedBuilder()
                    .setColor(COLORS.GREEN)
                    .setTitle('✅ Auto Posting Stopped')
                    .setDescription('Automatic message posting has been disabled for this server.')
                    .setTimestamp();
                
                return message.reply({ embeds: [successEmbed] });
            }

            const channelId = args[0];
            const messagesInput = args.slice(1).join(' ');
            
            // Validate channel
            const channel = message.guild.channels.cache.get(channelId);
            if (!channel) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid Channel')
                    .setDescription('Channel not found. Please provide a valid channel ID.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (!channel.isTextBased()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid Channel Type')
                    .setDescription('Please provide a text channel ID.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse messages
            const messages = messagesInput.split('|').map(msg => msg.trim()).filter(msg => msg.length > 0);
            
            if (messages.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ No Messages Provided')
                    .setDescription('Please provide at least one message separated by | (pipe).')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Save auto posting configuration
            const data = readData();
            if (!data.autoposting) data.autoposting = {};
            
            data.autoposting[message.guild.id] = {
                enabled: true,
                channelId: channelId,
                messages: messages,
                currentIndex: 0
            };
            
            writeData(data);

            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Auto Posting Configured')
                .setDescription(`Auto posting setup successfully!\n\n**Channel:** ${channel.toString()}\n**Messages:** ${messages.length}\n**Interval:** Every minute`)
                .setTimestamp()
                .addFields({
                    name: '📝 Messages Preview',
                    value: messages.slice(0, 3).map((msg, i) => `${i + 1}. ${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}`).join('\n') + 
                          (messages.length > 3 ? `\n... and ${messages.length - 3} more messages` : ''),
                    inline: false
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in autopost command:', err);
        }
    }
};