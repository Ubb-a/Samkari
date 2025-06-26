const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, deleteRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'deleteroadmap',
    description: 'Delete a roadmap permanently (admin only)',
    usage: 'deleteroadmap <roadmap_name>',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to delete roadmaps.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if roadmap name is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Name Missing')
                    .setDescription('**Usage:** `deleteroadmap roadmap_name`\n**Example:** `deleteroadmap backend`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args.join(' ');
            const guildId = message.guild.id;
            const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
            
            // Check if roadmap exists
            const roadmap = getRoadmap(roadmapKey);
            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap statistics for confirmation
            const tasks = roadmap.tasks || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completedBy && task.completedBy.length > 0);
            const totalCompletions = completedTasks.reduce((total, task) => total + (task.completedBy ? task.completedBy.length : 0), 0);

            // Get role information
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const roleName = role ? role.name : 'Unknown Role';

            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor(COLORS.YELLOW)
                .setTitle('⚠️ Delete Roadmap Confirmation')
                .setDescription(`Are you sure you want to **permanently delete** the "${roadmap.name}" roadmap?`)
                .addFields([
                    {
                        name: '📊 Roadmap Statistics',
                        value: `**Tasks:** ${totalTasks}\n**Completions:** ${totalCompletions}\n**Associated Role:** ${roleName}`,
                        inline: false
                    },
                    {
                        name: '⚠️ Warning',
                        value: 'This action **CANNOT BE UNDONE**!\nAll tasks and progress data will be permanently lost.',
                        inline: false
                    },
                    {
                        name: '🔄 To Confirm',
                        value: `Type: \`confirm delete ${roadmapName.toLowerCase()}\`\nTo cancel, ignore this message or type any other command.`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: 'This confirmation expires in 30 seconds',
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            const confirmMessage = await message.reply({ embeds: [confirmEmbed] });

            // Create message collector for confirmation
            const filter = (msg) => {
                return msg.author.id === message.author.id && 
                       msg.channel.id === message.channel.id;
            };

            const collector = message.channel.createMessageCollector({ 
                filter, 
                time: 30000, // 30 seconds
                max: 1 
            });

            collector.on('collect', async (collectedMessage) => {
                const content = collectedMessage.content.toLowerCase().trim();
                const expectedConfirmation = `confirm delete ${roadmapName.toLowerCase()}`;

                if (content === expectedConfirmation) {
                    // Delete the roadmap
                    const success = deleteRoadmap(roadmapKey);

                    if (success) {
                        const successEmbed = new EmbedBuilder()
                            .setColor(COLORS.GREEN)
                            .setTitle('✅ Roadmap Deleted')
                            .setDescription(`The "${roadmap.name}" roadmap has been permanently deleted.`)
                            .addFields({
                                name: '📊 Deleted Data',
                                value: `**Tasks:** ${totalTasks}\n**Completions:** ${totalCompletions}\n**Associated Role:** ${roleName}`,
                                inline: false
                            })
                            .setTimestamp()
                            .setFooter({
                                text: `Deleted by ${message.author.tag}`,
                                iconURL: message.author.displayAvatarURL({ dynamic: true })
                            });

                        await collectedMessage.reply({ embeds: [successEmbed] });
                    } else {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(COLORS.RED)
                            .setTitle('❌ Deletion Failed')
                            .setDescription('An error occurred while deleting the roadmap. Please try again.')
                            .setTimestamp();

                        await collectedMessage.reply({ embeds: [errorEmbed] });
                    }
                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🚫 Deletion Cancelled')
                        .setDescription(`Roadmap "${roadmap.name}" was **NOT** deleted.\nIncorrect confirmation received.`)
                        .setTimestamp();

                    await collectedMessage.reply({ embeds: [cancelEmbed] });
                }

                // Clean up messages
                try {
                    await confirmMessage.delete();
                    await collectedMessage.delete();
                } catch (error) {
                    // Messages might already be deleted, ignore errors
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    // No confirmation received, delete the confirmation message
                    try {
                        const timeoutEmbed = new EmbedBuilder()
                            .setColor(COLORS.GRAY)
                            .setTitle('⏰ Confirmation Timeout')
                            .setDescription(`Deletion of "${roadmap.name}" roadmap was cancelled due to timeout.`)
                            .setTimestamp();

                        await confirmMessage.edit({ embeds: [timeoutEmbed] });

                        // Delete timeout message after 5 seconds
                        setTimeout(async () => {
                            try {
                                await confirmMessage.delete();
                            } catch (error) {
                                // Message might already be deleted, ignore error
                            }
                        }, 5000);
                    } catch (error) {
                        // Message might already be deleted, ignore error
                    }
                }
            });

        } catch (err) {
            console.error('Error in deleteroadmap command:', err);
        }
    }
};