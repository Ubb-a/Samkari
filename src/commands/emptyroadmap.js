const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'emptyroadmap',
    description: 'Empty all tasks from a roadmap (admin only)',
    usage: 'emptyroadmap <roadmap_name>',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to empty roadmaps.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if roadmap name is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Roadmap Name')
                    .setDescription('**Usage:** `emptyroadmap roadmap_name`\n**Example:** `emptyroadmap backend`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args.join(' ');
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`Roadmap "${roadmapName}" doesn't exist in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!message.member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to empty this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const taskCount = roadmap.tasks.length;

            // Empty the roadmap directly
            roadmap.tasks = [];
            saveRoadmap(roadmapKey, roadmap);

            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Roadmap Emptied Successfully!')
                .setDescription(`**${roadmap.name}** has been emptied.\n\n**Deleted:** ${taskCount} tasks`)
                .setTimestamp()
                .setFooter({
                    text: `Emptied by ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in emptyroadmap command:', err);
        }
    }
};