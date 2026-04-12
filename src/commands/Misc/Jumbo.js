const { Command } = require('@sapphire/framework');

class Jumbo extends Command {
    constructor(context, options) {
        super(context, {
        ...options, 
        name: 'jumbo',
        aliases: [ 'extract' ],
        description: 'Extract an emoji URL (useful for mobile users)',
        detailedDescription: {
            'Command Forms and Arguments': 'n.jumbo [emoji]'
        },
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
        builder
            .setName('extract')
            .setDescription('Extract')
            .addStringOption((option) =>
            option
                .setName('emoji')
                .setDescription('A custom emoji')
                .setRequired(true)
            )
        )
    }

    extractEmoji(channel, emoji) {
        const EmoteRegex = new RegExp(/<(a)?:(\w+):(\d+)>/, "gmi");
        if (!emoji) return this.container.utils.sendError(channel, 'Please provide an emote.');
        const result = EmoteRegex.exec(emoji);
        if (!result) return this.container.utils.sendError(channel, 'Please provide a valid emote.');
        const url = `https://cdn.discordapp.com/emojis/${result[3]}${result[1] ? ".gif" : ".png"}?v=1`;

        let data = {
            name: result[2],
            id: result[3],
            url: url
        };

        return data;
    }

    jumbo(messageOrInteraction, emoji) {
        try {
            let data = this.extractEmoji(messageOrInteraction.channel, emoji);
            let embed = {
                color: this.container.utils.getColor('blue'),
                title: data.name,
                image: { url: data.url },
                footer: { text: `ID: ${data.id}` },
                timestamp: new Date(this.container.utils.validateSnowflake(data.id))
            };
            this.container.utils.sendMessage(messageOrInteraction.channel, { embeds: [embed] });
        } catch (err) {
            this.container.utils.sendError(messageOrInteraction.channel, err);
        }
    }

    async messageRun(message, args) {
        let emoji = await args.pick('string').catch(() => null);
        this.jumbo(message, emoji);
    }
  
    async chatInputRun(interaction) {
        const emoji = interaction.options.getString('emoji');
        await interaction.deferReply();
        this.jumbo(interaction, emoji);
    }
};

module.exports = { Jumbo };