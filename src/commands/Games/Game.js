const { Subcommand } = require('@sapphire/plugin-subcommands');
const { FlagQuizGame } = require('./FlagQuiz');

class Game extends Subcommand {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'game',
            aliases: ['games'],
            description: 'Play games and earn credits!',
            subcommands: [
                {
                    name: 'flagquiz',
                    messageRun: 'flagQuizMessage',
                    chatInputRun: 'flagQuizChatInput'
                }
            ]
        });

        this.flagQuiz = new FlagQuizGame(this.container);
    }

    async flagQuizMessage(message) {
        await this.container.utils.sendMessage(
            message.channel,
            this.flagQuiz.startingMessage
        );

        return this.flagQuiz.runQuiz(message.channel, message.author);
    }

    async flagQuizChatInput(interaction) {
        await this.container.utils.sendMessage(
            interaction,
            this.flagQuiz.startingMessage
        );

        return this.flagQuiz.runApplicationQuiz(
            interaction.channel,
            interaction.user
        );
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('game')
                .setDescription('Play games and earn credits!')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('flagquiz')
                        .setDescription('Guess the country from the flag.')
                )
        );
    }
}

module.exports = { Game };