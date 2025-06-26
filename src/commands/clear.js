const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'clear',
    description: 'Clear chat messages (admin only)',
    usage: 'clear [number]',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Messages" permission to use this command.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if bot has permission to delete messages
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Bot Permission Missing')
                    .setDescription('I need "Manage Messages" permission to delete messages.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse number of messages to delete
            let deleteCount = 5; // Default
            if (args.length > 0) {
                const parsed = parseInt(args[0]);
                if (isNaN(parsed) || parsed < 1) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ Invalid Number')
                        .setDescription('Please enter a valid number between 1 and 100.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
                deleteCount = Math.min(parsed, 100); // Discord limit is 100
            }

            // Delete the command message first
            await message.delete().catch(console.error);

            // Fetch and delete messages
            const messages = await message.channel.messages.fetch({ limit: deleteCount });
            const deleted = await message.channel.bulkDelete(messages, true);

            // Send confirmation (will auto-delete after 3 seconds)
            const confirmEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('🧹 Chat Cleared')
                .setDescription(`Successfully deleted ${deleted.size} messages.`)
                .setTimestamp()
                .setFooter({
                    text: 'This message will disappear in 3 seconds',
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });
            
            // Auto-delete confirmation message after 3 seconds
            setTimeout(async () => {
                try {
                    await confirmMessage.delete();
                } catch (error) {
                    // Message might already be deleted, ignore error
                }
            }, 3000);

        } catch (err) {
            console.error('Error in clear command:', err);
            
            // Handle the case where messages are too old (14+ days)
            if (err.code === 50034) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Messages Too Old')
                    .setDescription('Cannot delete messages older than 14 days. Please try with a smaller number.')
                    .setTimestamp();
                return message.channel.send({ embeds: [errorEmbed] });
            }
        }
    }
};