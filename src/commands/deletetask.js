const { EmbedBuilder } = require('discord.js');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'deletetask',
    description: 'Delete a specific task from a roadmap and reorder IDs',
    usage: 'deletetask <roadmap_name> <task_id>',
    
    async execute(message, args) {
        try {
            // Check if user is mentioned or has manage roles permission
            const mentionedUsers = message.mentions.users;
            const hasManageRoles = message.member.permissions.has('ManageRoles');
            
            if (!hasManageRoles && !mentionedUsers.has(message.author.id)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription('You need "Manage Roles" permission or mention to delete tasks.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Information')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`deletetask web-dev 3\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args[0];
            const taskId = parseInt(args[1]);

            if (isNaN(taskId) || taskId < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid Task Number')
                    .setDescription('Task number must be a number greater than 0.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Find task by ID
            const taskIndex = roadmap.tasks.findIndex(task => task.id === taskId);
            
            if (taskIndex === -1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task Not Found')
                    .setDescription(`No task with ID ${taskId} exists in roadmap "${roadmapName}".`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const deletedTask = roadmap.tasks[taskIndex];

            // Remove the task
            roadmap.tasks.splice(taskIndex, 1);

            // Reorder task IDs
            roadmap.tasks.forEach((task, index) => {
                task.id = index + 1;
            });

            // Save roadmap
            saveRoadmap(roadmapKey, roadmap);

            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Task Deleted Successfully!')
                .setDescription(`**Deleted Task:** ${deletedTask.title}\n**Roadmap:** ${roadmap.name}\n**Task IDs have been reordered**`)
                .setTimestamp()
                .setFooter({
                    text: `Total tasks: ${roadmap.tasks.length}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in deletetask command:', err);
        }
    }
};