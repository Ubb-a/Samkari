const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { saveRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'create',
    description: 'Create a new roadmap with role-based permissions',
    usage: '!create <roadmap_name> role:@<rolename>',
    
    async execute(message, args) {
        try {
        // Check if user has manage roles permission
        if (!message.member.permissions.has('ManageRoles')) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Access Denied')
                .setDescription('You need "Manage Roles" permission to create roadmaps.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Parse arguments
        if (args.length < 2) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Wrong Usage')
                .setDescription(`**Usage:** ${this.usage}\n**Example:** \`!create web-dev role:@Developer\``)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Extract roadmap name and role
        let roadmapName = '';
        let roleId = null;
        let roleName = '';

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg.startsWith('role:')) {
                // Extract role from mention or name
                const roleString = arg.substring(5);
                
                if (roleString.startsWith('<@&') && roleString.endsWith('>')) {
                    // Role mention format <@&123456789>
                    roleId = roleString.slice(3, -1);
                } else if (roleString.startsWith('@')) {
                    // @RoleName format
                    roleName = roleString.substring(1);
                    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (role) {
                        roleId = role.id;
                        roleName = role.name;
                    }
                } else {
                    // Direct role name
                    roleName = roleString;
                    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (role) {
                        roleId = role.id;
                        roleName = role.name;
                    }
                }
                break;
            } else {
                roadmapName += (roadmapName ? ' ' : '') + arg;
            }
        }

        // Validate inputs
        if (!roadmapName.trim()) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Invalid Roadmap Name')
                .setDescription('Please enter a valid roadmap name.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        if (!roleId) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Invalid Role')
                .setDescription('Could not find the required role. Make sure the role exists and the name is correct.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Get role object for validation
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Role Not Found')
                .setDescription('The required role does not exist in this server.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Check if roadmap already exists
        const existingRoadmaps = getRoadmaps();
        const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
        
        if (existingRoadmaps[roadmapKey]) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Roadmap Already Exists')
                .setDescription(`A roadmap named "**${roadmapName}**" already exists in this server.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Create roadmap object
        const roadmap = {
            id: roadmapKey,
            name: roadmapName,
            guildId: message.guild.id,
            guildName: message.guild.name,
            roleId: role.id,
            roleName: role.name,
            createdBy: message.author.id,
            createdAt: new Date().toISOString(),
            tasks: [
                {
                    id: 1,
                    title: 'Getting Started',
                    description: 'Welcome to your new roadmap! You can add tasks using the task management commands.',
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            ]
        };

        // Save roadmap
        try {
            saveRoadmap(roadmapKey, roadmap);
            
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Roadmap Created Successfully!')
                .setDescription(`**Roadmap Name:** ${roadmapName}\n**Required Role:** ${role}\n**Created by:** ${message.author}\n\nUsers with the ${role} role can access this roadmap using \`!myroadmaps\` and \`!showroadmap ${roadmapName}\``)
                .setTimestamp();
            
            return message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Error creating roadmap:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Creation Failed')
                .setDescription('An error occurred while creating the roadmap. Please try again.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        } catch (err) {
            console.error('Error in create command:', err);
        }
    }
};
