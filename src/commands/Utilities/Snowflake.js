const { Command } = require('@sapphire/framework');

class Snowflake extends Command {
    constructor(context, options) {
        super(context, {
        ...options, 
        name: 'snowflake',
        description: 'Displays the creation date of a Discord snowflake.',
        detailedDescription: {
            'Command Forms and Arguments': 'snowflake [snowflake]'
        },
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
        builder
            .setName('snowflake')
            .setDescription('Displays the creation date of a Discord snowflake ID')
            .addStringOption((option) =>
            option
                .setName('snowflake')
                .setDescription('A Discord snowflake')
                .setRequired(true)
            )
        )
    }

    snowflake(messageOrInteraction, snowflake) {
        try {
            let timestamp = this.container.utils.validateSnowflake(snowflake);
            let embed = {
                title: 'Valid snowflake!',
                color: this.container.utils.getColor('blue'),
                description: `This snowflake was created at **<t:${Math.floor(timestamp / 1000)}>** (<t:${Math.floor(timestamp / 1000) }:R>)`
            }
            this.container.utils.sendMessage(messageOrInteraction.channel, { embeds: [embed] });
        } catch (err) {
            this.container.utils.sendError(messageOrInteraction.channel, err);
        }
    }

    async messageRun(message, args) {
        const snowflake = await args.pick('string').catch(() => null)
        this.snowflake(message, snowflake);
    }

    async chatInputRun(interaction) {
        const snowflake = interaction.options.getString('snowflake');
        await interaction.deferReply();
        this.snowflake(interaction, snowflake);
    }
}

module.exports = Snowflake;