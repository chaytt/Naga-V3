const { Command } = require('@sapphire/framework');

class Spotify extends Command {
    constructor(context, options) {
        super(context, {
        ...options, 
        name: 'spotify',
        description: 'Displays the Spotify presence for a given user. Returns your own Spotify presence if no user is provided.',
        detailedDescription: {
            'Command Forms and Arguments': 'spotify [user]'
        },
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
        builder
            .setName('spotify')
            .setDescription('Displays the Spotify presence for a given user.')
            .addUserOption((option) =>
            option
                .setName('member')
                .setDescription('A member of the server')
                .setRequired(false)
            )
        )
    }

    /**
     * Returns the embed with Spotify presence info
     * @param {Message|Interaction} messageOrInteraction A Message or Interaction object
     * @param {User} member A member object
     */
    spotify(messageOrInteraction, member) {
        try {
            if (member.user.bot) return this.container.utils.sendError(messageOrInteraction.channel, 'Please enter a human user');
            let spotify = (member.presence.activities.filter(n => n.name === 'Spotify'))[0];
            let embed = {
                author: {
                    name: 'Spotify',
                    icon_url: 'https://cdn.discordapp.com/emojis/663452041992994846.png?v=1'
                },
                thumbnail: { url: `https://i.scdn.co/image/${ spotify.assets.largeImage.slice(8)}` || null },
                color: 1947988,
                fields: [
                    { name: 'Title', value: `[${spotify.details}](https://open.spotify.com/track/${spotify.syncId})`},
                    { name: 'Artist', value: spotify.state, inline: false },
                    { name: 'Album', value: spotify.assets.largeText, inline: false }
                ],
                footer: {
                    text: member.username,
                    icon_url: member.displayAvatarURL
                }
            };
            this.container.utils.sendMessage(messageOrInteraction.channel, { embeds: [embed]});
        } catch (err) {
            this.container.utils.sendError(messageOrInteraction.channel, err);
        }
    }

    async messageRun(message, args) {
        const memberArg = await args.pick('string').catch(() => null) || message.member;
        const member = await message.channel.guild.members.fetch({ user: memberArg, withPresences: true });
        this.spotify(message, member);
    }

    async chatInputRun(interaction) {
        const user = interaction.options.getUser('member') || interaction.member;
        const member = await interaction.channel.guild.members.fetch({ user: user.id, withPresences: true });
        await interaction.deferReply();
        this.spotify(interaction, member);
    }
}

module.exports = Spotify;