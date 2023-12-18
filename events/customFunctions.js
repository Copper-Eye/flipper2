const { EmbedBuilder } = require('discord.js');

function wrapper(itemId){
    const embed = new EmbedBuilder()
    .setTitle(`itemDetails.name - ID: itemId`)
    .setDescription(`[Osrs.cloud](https://prices.osrs.cloud/item/}) )\n
    **Volume**: 
    ` )
    .setColor('#03fcdb')
    .addFields(
        { name: '\u200B', value: '\u200B' },
    )
    .setTimestamp();
    return embed;
}

module.exports = [
    wrapper,
]