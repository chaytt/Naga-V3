const { Command } = require('@sapphire/framework');
const axios = require('axios');

const HEX_REGEX = /^#?[0-9a-fA-F]{6}$/;

class Color extends Command {
  constructor(context, options) {
    super(context, {
      ...options, 
      name: 'color',
      aliases: ['colour'],
      description: 'Display a color. Displays a random color if one isn\'t provided.',
      detailedDescription: {
        'Command Forms and Arguments': '`n.color [hex code / random]`\n' + 
                                       '**Hex Code:** A standard hex code\n' +
                                       '**Random:** A random color'
      },
    });
  }

    registerApplicationCommands(registry) {
      registry.registerChatInputCommand((builder) =>
        builder
          .setName('color')
          .setDescription('colors')
          .addStringOption((option) =>
            option
              .setName('hex')
              .setDescription('A hex code')
              .setRequired(false)
          )
          .addBooleanOption((option) => 
            option
              .setName('random')
              .setDescription('A random color')
              .setRequired(false)
          )
      )
    }

    random() {
      let int = (Math.random() * (1 << 24) | 0)
      let color = {
        integer: int,
        hex: ('00000' + int.toString(16)).slice(-6),
        rgb: [(int & 0xff0000) >> 16, (int & 0x00ff00) >> 8, (int & 0x0000ff)]
      }
      return color;
    }

    /**
     * Fetches color information from API
     * @param {String} color A color hex code
     * @returns 
     */
    async color(messageOrInteraction, color) {
        try {
            if (!color.match(HEX_REGEX)) color = 'random';
            if (color === 'random') color = this.random().hex;
            let colorObj = {
                name: null,
                hex: color || null,
                integer: null,
                rgb: this.container.utils.hexToRGB(color),
                preview: null,
            };

            colorObj.integer = parseInt(`0x${colorObj.hex}`)
            colorObj.preview = `http://placehold.it/300x300.png/${colorObj.hex}/000000&text=%E2%80%8B`;

            await axios.all([axios.get(`https://www.thecolorapi.com/id?hex=${color}`)]).then(res => {
              colorObj.name = res[0].data.name.value;
              colorObj.preview = res[0].data.image.bare;
            });

            let embed = {
                title: 'Color',
                color: colorObj.integer || 0,
                thumbnail: { url: colorObj.preview },
                fields: [
                    { name: 'Name', value: colorObj.name, inline: false },
                    { name: 'Hex', value: colorObj.hex, inline: false },
                    { name: 'RGB', value: colorObj.rgb.join(', '), inline: false }
                ],
            };

            this.container.utils.sendMessage(messageOrInteraction.channel, { embeds: [embed] });
        } catch (err) {
            this.container.utils.sendError(messageOrInteraction.channel, err);
        }
    };

    async messageRun(message, args) {
        let colorArg = await args.pick('string').catch(() => null) || this.random().hex;
        await this.color(message, colorArg);
    };
  
    async chatInputRun(interaction) {
        const colorArg = interaction.options.getString('hex');
        const isRandom = interaction.options.getBoolean('random');

        let color = colorArg || this.random().hex;
        if (isRandom) color = this.random().hex;

        await interaction.deferReply();
        await this.color(interaction, color);
    }
}

module.exports = { Color };