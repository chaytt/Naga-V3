const { Command } = require('@sapphire/framework');
const flags = Object.entries(require('C:/Users/chayt/Naga-V3/src/commands/Games/codes.json'));
const startingMessage = 
`Guess the succeeding country by its flag in under 30 seconds:
- First question grants you 300 credits
- Answering succeeding flags earns 100 credits
- You only have 1 attempt per question
- Game begins in 5 seconds...`

class FlagQuiz extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: "flagquiz",
            aliases: ["flags"],
            description: "Guess the country from the flag!"
        });
    }


    // n. command
    async messageRun(message) {
        await channel.send(startingMessage)
        return this.runQuiz(message.channel, message.author);
    }

    // slash command
    async chatInputRun(interaction) {
        await interaction.reply(startingMessage);
        return this.runQuiz(interaction.channel, interaction.user);
    }
    async runQuiz(channel, user) {
        let playing = true;
        
        while (playing) {
            const [code, country] = flags[Math.floor(Math.random() * flags.length)];
            const flagURL = `https://flagcdn.com/w2560/${code}.png`;

            await channel.send({
                content: "which one is this u silly billy",
                files: [flagURL]
            });

            const filter = (m) => m.author.id === user.id;

            try {
                const collected = await channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });

                const answer = collected.first().content.toLowerCase();

                if (answer === country.toLowerCase()) {
                    await channel.send(`Correct!`);
                } else {
                    playing = false;
                    await channel.send(`Nope! It was **${country}**`);    
                }
            } catch {
                await channel.send(`Time's up! It was **${country}**`);
                playing = false;
            }
        }
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("flagquiz")
                .setDescription("Guess the country from the flag!"),
                { guildIds: ['1096261588375318578'] }
        );
    }
}

module.exports = { FlagQuiz };