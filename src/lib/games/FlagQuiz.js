const {
    ButtonStyle,
    ContainerBuilder,
    LabelBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    ModalBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const flags = Object.entries(require('../../assets/flags/flagcodes.json'));
const startingMessage = `Guess the succeeding country by its flag in under 30 seconds:
- First question grants you 300 credits
- Answering succeeding flags earns 100 credits
- You only have 1 attempt per question
- Game begins in 5 seconds...`;

class FlagQuizGame {
    constructor(container) {
        this.container = container;
        this.startingMessage = startingMessage;
    }

    async runQuiz(channel, user) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        let playing = true;
        let credits = 300;

        while (playing) {
            const [code, aliases] = flags[Math.floor(Math.random() * flags.length)];
            const flagURL = `https://flagcdn.com/w2560/${code}.png`;
            const validAnswers = aliases.map(alias => alias.toLowerCase());
            const displayName = aliases[0] || code;

            await channel.send({ content: 'Guess the flag!', files: [flagURL] });

            try {
                const collected = await channel.awaitMessages({
                    filter: message => message.author.id === user.id,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });
                const answer = collected.first().content.toLowerCase();

                if (validAnswers.includes(answer)) {
                    await this.container.utils.sendSuccess(channel, 'Correct!');
                    credits += 100;
                } else {
                    playing = false;
                    await this.container.utils.sendError(channel, `Nope! It was **${displayName}**. You earned ${credits} credits!`);
                }
            } catch {
                playing = false;
                await this.container.utils.sendError(channel, `Time's up! It was **${displayName}**. You earned ${credits} credits!`);
            }
        }
    }

    async runApplicationQuiz(channel, user) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        let playing = true;
        let correctAnswers = 0;
        let credits = 200;
        let flagMessage;
        const guessedFlagCodes = [];

        while (playing) {
            const [code, aliases] = flags[Math.floor(Math.random() * flags.length)];
            const flagURL = `https://flagcdn.com/w2560/${code}.png`;
            const validAnswers = aliases.map(alias => alias.toLowerCase());
            const displayName = aliases[0] || code;
            const buttonId = `flagquiz:${user.id}:${Date.now()}`;
            const buildContainer = (accentColor, footerText, buttonDisabled = false) => new ContainerBuilder()
                .setAccentColor(accentColor)
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL(flagURL).setDescription('Country flag')
                ))
                .addSectionComponents(new SectionBuilder()
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent('Guess the flag!'))
                    .setButtonAccessory(button => button
                        .setCustomId(buttonId)
                        .setLabel('Answer')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(buttonDisabled)
                    )
                )
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

            const container = buildContainer(
                this.container.utils.getColor('green'),
                `Correct answers: ${correctAnswers} | Credits: ${credits}`
            );

            if (flagMessage) {
                await flagMessage.edit({ components: [container] });
            } else {
                flagMessage = await this.container.utils.sendMessage(channel, {
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            let buttonInteraction;
            try {
                buttonInteraction = await flagMessage.awaitMessageComponent({
                    filter: interaction => interaction.customId === buttonId && interaction.user.id === user.id,
                    time: 30000
                });
            } catch {
                await flagMessage.edit({
                    components: [buildContainer(0xED4245, `Time's up! The answer was **${displayName}**. Correct answers: ${correctAnswers} | Credits: ${credits}\n\n${guessedFlagCodes.map(flagCode => `:flag_${flagCode}:`).join(' ')}`, true)]
                });
                playing = false;
                continue;
            }

            const modalId = `${buttonId}:modal`;
            const answerInput = new TextInputBuilder()
                .setCustomId('country')
                .setPlaceholder('Enter the country shown by the flag')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const answerModal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle('Guess the flag!')
                .addLabelComponents(new LabelBuilder()
                    .setLabel('What country is this?')
                    .setTextInputComponent(answerInput)
                );

            await buttonInteraction.showModal(answerModal);

            let modalInteraction;
            try {
                modalInteraction = await buttonInteraction.awaitModalSubmit({
                    filter: interaction => interaction.customId === modalId && interaction.user.id === user.id,
                    time: 30000
                });
            } catch {
                await flagMessage.edit({
                    components: [buildContainer(0xED4245, `Time's up! The answer was **${displayName}**. Correct answers: ${correctAnswers} | Credits: ${credits}\n\n${guessedFlagCodes.map(flagCode => `:flag_${flagCode}:`).join(' ')}`, true)]
                });
                playing = false;
                continue;
            }

            const answer = modalInteraction.fields.getTextInputValue('country').trim().toLowerCase();
            if (validAnswers.includes(answer)) {
                await modalInteraction.deferUpdate();
                correctAnswers += 1;
                credits += 100;
                guessedFlagCodes.push(code);
            } else {
                await modalInteraction.deferUpdate();
                await flagMessage.edit({
                    components: [buildContainer(this.container.utils.getColor('red'), `Incorrect! The answer was **${displayName}**. Correct answers: ${correctAnswers} | Credits: ${credits}\n\n${guessedFlagCodes.map(flagCode => `:flag_${flagCode}:`).join(' ')}`, true)]
                });
                playing = false;
            }
        }
    }
}

module.exports = { FlagQuizGame };