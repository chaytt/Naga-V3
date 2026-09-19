const { Subcommand } = require('@sapphire/plugin-subcommands');
const { FlagQuizGame } = require('../../lib/games/FlagQuiz');
const { TypingQuizGame } = require('../../lib/games/TypingQuiz');


// this is the "main" command, all individual games are subcommands of command n.game | /game

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
                },
                {
                    name: 'typingquiz',
                    messageRun: 'typingQuizMessage',
                    chatInputRun: 'typingQuizChatInput'
                }
            ]
        });

        this.flagQuiz = new FlagQuizGame(this.container);
        this.typingQuiz = new TypingQuizGame(this.container);
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

    async typingQuizMessage(message) {
        await this.container.utils.sendMessage(
            message.channel,
            this.typingQuiz.startingMessage
        );

        return this.typingQuiz.runQuiz(message.channel, message.author);
    }

    async typingQuizChatInput(interaction) {
        await this.container.utils.sendMessage(
            interaction,
            this.typingQuiz.startingMessage
        );

        return this.typingQuiz.runApplicationQuiz(interaction.channel, interaction.user);
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
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('typingquiz')
                        .setDescription('Test your typing speed.')
                )
        );
    }
}

module.exports = { Game };