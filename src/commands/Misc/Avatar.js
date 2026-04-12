const { Command } = require('@sapphire/framework');

class Avatar extends Command {
    constructor(context, options) {
        super(context, {
            ...options, 
            name: 'avatar',
            aliases: ['useravatar'],
            description: 'Display a user\'s avatar.',
            detailedDescription: {
                'Command Forms and Arguments': '`n.avatar [user]`\n'
            },
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('avatar')
                .setDescription('Returns a user avatar')
                .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User')
                .setRequired(false)
            )
        )
    }

    avatar(messageOrInteraction, user) {
        try {
            let avatar = user.displayAvatarURL({ size: 4096 });
            let embed = {
                title: 'Avatar',
                color: user.displayColor || this.container.utils.getColor('blue'),
                description: `${user.displayName} (${user.user.username})`,
                image: { url: avatar },
                footer: { text: user.id },
                timestamp: new Date()
            };

            this.container.utils.sendMessage(messageOrInteraction.channel, { embeds: [embed] });
        } catch (err) {
            this.container.utils.sendError(messageOrInteraction.channel, err);
        }
    }

    async messageRun(message, args) {
        const userArg = await args.pick('string').catch(() => null) || message.author;
        const user = await message.channel.guild.members.fetch(userArg);
        this.avatar(message, user);
    }

    async chatInputRun(interaction) {
        const userArg = interaction.options.getUser('user') || interaction.user;
        await interaction.deferReply();
        let user = await interaction.channel.guild.members.fetch(userArg);
        this.avatar(interaction, user);
    }
}

module.exports = { Avatar };