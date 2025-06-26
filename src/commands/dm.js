const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'dm',
    description: 'Send a private message to all users with a specific role (admin only)',
    usage: 'dm <@role> <message>',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to use this command.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Arguments')
                    .setDescription('**Usage:** `dm @role message text`\n**Example:** `dm @Developer Check out the new tasks!`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse role mention
            const roleInput = args[0];
            let targetRole = null;

            if (roleInput.startsWith('<@&') && roleInput.endsWith('>')) {
                // Role mention format
                const roleId = roleInput.slice(3, -1);
                targetRole = message.guild.roles.cache.get(roleId);
            } else {
                // Role name format
                targetRole = message.guild.roles.cache.find(role => 
                    role.name.toLowerCase() === roleInput.toLowerCase().replace('@', '')
                );
            }

            if (!targetRole) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Role Not Found')
                    .setDescription(`Role "${roleInput}" doesn't exist in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get message content
            const messageContent = args.slice(1).join(' ');

            // Get all members with the target role
            const membersWithRole = message.guild.members.cache.filter(member => 
                member.roles.cache.has(targetRole.id) && !member.user.bot
            );

            if (membersWithRole.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('⚠️ No Recipients')
                    .setDescription(`No members found with the ${targetRole.name} role.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Delete the command message for privacy
            await message.delete().catch(console.error);

            // Create DM embed
            const dmEmbed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`📬 Message from ${message.guild.name}`)
                .setDescription(messageContent)
                .addFields({
                    name: 'Sent to',
                    value: `Members with ${targetRole.name} role`,
                    inline: true
                })
                .setTimestamp()
                .setFooter({
                    text: `From: ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(message.guild.iconURL({ dynamic: true }));

            // Send DMs to all members with the role
            let successCount = 0;
            let failCount = 0;

            for (const [memberId, member] of membersWithRole) {
                try {
                    await member.send({ embeds: [dmEmbed] });
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.log(`Failed to DM ${member.user.tag}: ${error.message}`);
                }
            }

            // Send confirmation in the channel
            const confirmEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('📬 Mass DM Sent')
                .setDescription(`Message sent to members with ${targetRole.name} role`)
                .addFields([
                    {
                        name: '✅ Successfully Sent',
                        value: `${successCount} members`,
                        inline: true
                    },
                    {
                        name: '❌ Failed to Send',
                        value: `${failCount} members`,
                        inline: true
                    },
                    {
                        name: '📝 Message Preview',
                        value: messageContent.length > 100 ? 
                            messageContent.substring(0, 100) + '...' : 
                            messageContent,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: 'Failed sends are usually due to disabled DMs',
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });

            // Auto-delete confirmation after 10 seconds
            setTimeout(async () => {
                try {
                    await confirmMessage.delete();
                } catch (error) {
                    // Message might already be deleted, ignore error
                }
            }, 10000);

        } catch (err) {
            console.error('Error in dm command:', err);
        }
    }
};