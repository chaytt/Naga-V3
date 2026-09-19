const {
    AttachmentBuilder,
    ButtonStyle,
    ContainerBuilder,
    LabelBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    ModalBuilder,
    SectionBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');

const sentences = require('../../assets/typing/typingsentences.json');

registerFont(path.join(__dirname, '../../assets/typing/Verdana.ttf'), {
    family: 'Verdana'
});

const startingMessage = 'Type the sentence as fast as you can! The faster you type, the more credits you earn!';

function calculateCredits(wpm) {
  if (wpm <= 40) {
    return 100;
  } else if (wpm <= 50) {
    return 200;
  } else if (wpm <= 60) {
    return 300;
  } else if (wpm <= 70) {
    return 400;
  } else {
    return 500; // 70+ WPM
  }
}

function wrapText(ctx, text, maxWidth) {
    return text.split(/\s+/).reduce((lines, word) => {
        const currentLine = lines[lines.length - 1];
        const candidate = currentLine ? `${currentLine} ${word}` : word;

        if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
            lines[lines.length - 1] = candidate;
        } else {
            lines.push(word);
        }

        return lines;
    }, ['']);
}

function createTypingQuizImage(sentence) {
    const width = 900;
    const padding = 36;
    const fontSize = 30;
    const lineHeight = 42;
    const canvas = createCanvas(width, lineHeight + padding * 2);
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px Verdana`;
    const lines = wrapText(ctx, sentence, width - padding * 2);
    canvas.height = lines.length * lineHeight + padding * 2;

    // Resizing the canvas resets the drawing context state.
    ctx.font = `${fontSize}px Verdana`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#20252f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2b313d';
    ctx.fillRect(padding / 2, padding / 2, width - padding, canvas.height - padding);
    ctx.strokeStyle = '#77e0c2';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding / 2 + 1, padding / 2 + 1, width - padding - 2, canvas.height - padding - 2);
    ctx.fillStyle = '#f8fafc';
    lines.forEach((line, index) => {
        ctx.fillText(line, padding, padding + lineHeight * index + lineHeight / 2);
    });

    return new AttachmentBuilder(canvas.toBuffer('image/png'), {
        name: 'typing-quiz.png'
    });
}

class TypingQuizGame {
    constructor(container) {
        this.container = container;
        this.startingMessage = startingMessage;
    }

    async runQuiz(channel, user) {
        const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
        const attachment = createTypingQuizImage(sentence);

        this.container.utils.sendMessage(channel, {
            files: [attachment]
        });
        
        const startTime = Date.now()
        try {
                const collected = await channel.awaitMessages({
                    filter: message => message.author.id === user.id,
                    max: 1,
                    time: 300000,
                    errors: ['time']
                });
                const answer = collected.first().content.trim();

                if (answer == sentence) {
                    const endTime = Date.now();
                    const totalSeconds = (endTime - startTime) / 1000 // in seconds
                    const totalMinutes = totalSeconds / 60 // in minutes for easy wpm calc
                    const wordCount = sentence.split(/\s+/).length

                    const wpm = wordCount / totalMinutes

                    const credits = calculateCredits(wpm)

                    await this.container.utils.sendSuccess(channel, `You got it! You typed ${wordCount} words in ${Math.floor(totalSeconds)} seconds (${Math.floor(wpm)} WPM), and earned ${credits} credits!`);
                } else {
                    await this.container.utils.sendError(channel, `Oops, you typed it wrong! You earned 100 credits for trying.`);
                }
            } catch (err) {
                console.error(err)
                await this.container.utils.sendError(channel, `You timed out! You earned 100 credits for trying.`);
            }
    }

    async runApplicationQuiz(channel, user) {
        const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
        const attachment = createTypingQuizImage(sentence);

        const buttonId = `typingquiz:${user.id}:${Date.now()}`;
        const buildContainer = (accentColor, buttonDisabled = false) => new ContainerBuilder()
            .setAccentColor(accentColor)
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('attachment://typing-quiz.png')
                        .setDescription('Typing quiz sentence')
                )
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(textDisplay =>
                        textDisplay.setContent(`Type the sentence!`)
                    )
                    .setButtonAccessory(button => button
                        .setCustomId(buttonId)
                        .setLabel('Type sentence')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(buttonDisabled)
                    )
            );

        const quizMessage = await this.container.utils.sendMessage(channel, {
            components: [buildContainer(this.container.utils.getColor('green'))],
            files: [attachment],
            flags: MessageFlags.IsComponentsV2
        });

        const startTime = Date.now();
        let buttonInteraction;

        try {
            buttonInteraction = await quizMessage.awaitMessageComponent({
                filter: interaction => interaction.customId === buttonId && interaction.user.id === user.id,
                time: 300000
            });
        } catch {
            await quizMessage.edit({
                components: [buildContainer(
                    this.container.utils.getColor('red'),
                    true
                )]
            });
            return;
        }

        const modalId = `${buttonId}:modal`;
        const answerInput = new TextInputBuilder()
            .setCustomId('sentence')
            .setPlaceholder('Type the sentence!')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        const answerModal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle('Typing quiz')
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel(`Type the sentence!`)
                    .setTextInputComponent(answerInput)
            );

        await buttonInteraction.showModal(answerModal);

        let modalInteraction;
        try {
            modalInteraction = await buttonInteraction.awaitModalSubmit({
                filter: interaction => interaction.customId === modalId && interaction.user.id === user.id,
                time: 300000
            });
        } catch {
            await quizMessage.edit({
                components: [buildContainer(
                    this.container.utils.getColor('red'),
                    true
                )]
            });
            await this.container.utils.sendError(channel, 'You ran out of time! You earned 100 credits for trying.');
            return;
        }

        const answer = modalInteraction.fields.getTextInputValue('sentence').trim();
        if (answer === sentence) {
            const totalSeconds = (Date.now() - startTime) / 1000;
            const wordCount = sentence.split(/\s+/).length;
            const wpm = wordCount / (totalSeconds / 60);
            const credits = calculateCredits(wpm);

            await this.container.utils.sendSuccess(modalInteraction, `You got it! You typed ${wordCount} words in ${Math.floor(totalSeconds)} seconds (${Math.floor(wpm)} WPM), and earned ${credits} credits.`);

            await quizMessage.edit({
                components: [buildContainer(
                    this.container.utils.getColor('green'),
                    true
                )]
            });
        } else {
            await this.container.utils.sendError(modalInteraction, 'Oops, you typed it wrong! You earned 100 credits for trying.');
            await quizMessage.edit({
                components: [buildContainer(
                    this.container.utils.getColor('red'),
                    true
                )]
            });
        }
    }
}

module.exports = { TypingQuizGame };