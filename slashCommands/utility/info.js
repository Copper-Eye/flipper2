//To Do: Find accurate way to do averages and WHERE these datasources come from. 
//Make latest prices run every 60 seconds.
//Compare latest prices against avg1hr and 12hr to detect and message what is best to invest in.
//Graph view.
//Implement GE Tax.
//Build in long term and short term trend list.
//CORRECT FORMULA FOR MAX PROFIT IS {highestOf(1hr or 12hr)-lowestOf(latest instabuy or latest instasell)*limit}

const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const pricesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/latest';
const mappingApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/mapping';
const volumesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/volumes';
const onehr = 'https://prices.runescape.wiki/api/v1/osrs/1h';
const officialGEOldSchoolApi = "https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item="

// Helper function to get item details by ID using the mapping endpoint
async function getLatestPrices(itemId) {
    try {
        // Make a GET request to the main OSRS prices API
        const response = await fetch(pricesApiUrl);

        // Check if the request was successful (status code 200)
        if (response.ok) {
            const data = await response.json();

            // Check if 'data' field exists and has at least one element
            if ('data' in data && data['data']) {
                // Check if the specified itemId exists in 'data'
                if (itemId in data['data']) {
                    const item_info = data['data'][itemId];
                    console.log(item_info);

                    // Perform further actions with itemHighPrice and itemLowPrice
                    // For example, return them or use them in your application
                    return {
                        'high': item_info.high || 'N/A',
                        'low': item_info.low || 'N/A',
                        'hight': item_info.highTime || 'N/A',
                        'lowt': item_info.lowTime || 'N/A'
                    };
                } else {
                    console.error(`Error: Item ID ${itemId} not found in the API response.`);
                    return null;
                }
            } else {
                console.error('Error: No data found in the API response.');
                return null;
            }
        } else {
            console.error(`Error fetching OSRS prices. Status Code: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`An error occurred during the request: ${error.message}`);
        return null;
    }
}

async function getItemDetailsById(itemId) {
    try {
        const response = await fetch(mappingApiUrl);
        // Log the response status and text
        console.log(`Mapping API Response Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();

            for (const item of data) {
                if (String(item.id) === itemId) {
                    console.log('Found matching item:', item);
                    return {
                        'name': item.name || 'Unknown',
                        'examine': item.examine || 'No examine information available',
                        'members': item.members || false,
                        'low_alch': item.lowalch || 'N/A',
                        'high_alch': item.highalch || 'N/A',
                        'ge_vaule': item.value || 'N/A',
                        'ge_limit': item.limit || 'N/A',
                        'icon': item.icon || 'N/A'
                    };
                }
            }
            return null;
        } else {
            console.error(`Error fetching item details: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching item details: ${error.message}`);
        return null;
    }
}
function extractOneHrPrices(dataset) {
    let extractedPrices = { avgHighPrice: null, avgLowPrice: null };
    
    for (let i = dataset.data.length - 1; i >= 0; i--) {
      const entry = dataset.data[i];
      
      if (extractedPrices.avgHighPrice === null && entry.avgHighPrice !== null) {
        extractedPrices.avgHighPrice = entry.avgHighPrice;
      }
      
      if (extractedPrices.avgLowPrice === null && entry.avgLowPrice !== null) {
        extractedPrices.avgLowPrice = entry.avgLowPrice;
      }
      
      if (extractedPrices.avgHighPrice !== null && extractedPrices.avgLowPrice !== null) {
        break; // Exit the loop if both values are found
      }
    }
    return Math.floor((extractedPrices.avgHighPrice+extractedPrices.avgLowPrice)/2);
  }
//satisfied with this solution
async function getOneHour(itemId) {
    try {
        const response2 = await fetch('https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=' + itemId);

        if (response2.ok) {
            const data2 = await response2.json();
                    return {
                        'avg': extractOneHrPrices(data2)
                    };
                } else {
                    console.error(`Error: Item ID ${itemId} not found in the API response.`);
                    return null;
                }
            } catch (error) {
        console.error(`An error occurred during the request: ${error.message}`);
        return null;
    }
}

async function getTwelveHour(itemId) {
    try {
        const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id='+itemId);

        if (response.ok) {
            const dataset = await response.json();
            // Extract the last/recent 12 entries. Filter out nulls so 12 always returned. Calculate average overall then floor.
            const last12ValidEntries = dataset.data
            .filter(entry => entry.avgHighPrice !== null && entry.avgLowPrice !== null)
            .slice(-12);
          
          const cumulativeSum = last12ValidEntries.reduce((acc, entry) => {
            const avgLowPrice = entry.avgLowPrice !== null ? entry.avgLowPrice : 0;
            return acc.concat((acc.length > 0 ? acc[acc.length - 1] : 0) + (entry.avgHighPrice + avgLowPrice) / 2);
          }, []);
          
          //console.log(last12ValidEntries);
          
          const overallAverage = cumulativeSum[cumulativeSum.length - 1] / cumulativeSum.length;
          
          return {
            'avg': Math.floor(overallAverage)
          };
          
                } else {
                    console.error(`Error: Item ID ${itemId} not found in the API response.`);
                    return null;
                }
            }  catch (error) {
        console.error(`An error occurred during the request: ${error.message}`);
        return null;
    }
}
    // Helper function to get item volume by ID using the volumes endpoint
async function getItemVolume(itemId) {
    try {
        const response = await fetch(volumesApiUrl);
        if (response.ok) {
            const data = await response.json();
            
            // Access and process data as needed
            // For example, you can access a specific item's volume like this:
            // Return the entire data object or specific information as needed
            return {
                'volume': (data.data[itemId]) || 'Unknown',
                'lastUpdated': convert_unix_timestamp(data.timestamp) || 'Unknown'
            }
        } else {
            console.error(`Error fetching volumes: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching volumes: ${error.message}`);
        return null;
    }
}
async function getOfficialGEStats(itemId) {
    try {
        const response = await fetch(officialGEOldSchoolApi+itemId);

        if (response.ok) {
            const dataset = await response.json();
                    console.log(dataset);
                    return {
                        'currentPrice': dataset.item.current.price,
                        'trend30': dataset.item.day30.change,
                        'trend90' : dataset.item.day90.change,
                        'trend180' : dataset.item.day180.change
                    };
                } else {
                    console.error(`Error: Item ID ${itemId} not found in the API response.`);
                    return null;
                }
            }  catch (error) {
        console.error(`An error occurred during the request: ${error.message}`);
        return null;
    }
}

// Function to convert UNIX timestamp to a readable format
function convert_unix_timestamp(timestamp) {
    return new Date(timestamp * 1000).toUTCString();
}
function formatNumber(number) {
    // Convert the number to a string
    let intNumber = number.toString();
  
    // Insert commas for thousands, millions, etc.
    intNumber = intNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
 
    return intNumber;
  }
module.exports = {
    name: 'info',
    description: 'Check info of an OSRS item.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'item_id',
            description: 'The ID of the item.',
            type: 4, // TYPE 4 is INTEGER
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const itemId = String(interaction.options.getInteger('item_id'));
        console.log("Input /info itemId: " + itemId);
        try {
            // Make a GET request to get additional item details
            const itemDetails = await getItemDetailsById(itemId);
            const itemVolume = await getItemVolume(itemId);
            const itemLatest = await getLatestPrices(itemId);
            const oneHour = await getOneHour(itemId);
            const twelveHour = await getTwelveHour(itemId);
            const officialGE = await getOfficialGEStats(itemId);

            const icon_filename = itemDetails["name"].replace(/\ /g, '_').replace(/\(/g, '%28').replace(/\)/g, '%29');
            const image_url = `https://oldschool.runescape.wiki/images/${icon_filename}_detail.png?7263b`;
            //console.log(image_url);

                        // Send the information to the Discord channel using an embed
                        //Max profit = 12hr Average - (Instabuy or Instasell) usually lowest, rounded down. Then apply tax.
                        const embed = new EmbedBuilder()
                        .setTitle(`${itemDetails.name} - ID: ${itemId}`)
                        .setDescription(`[Osrs.cloud](https://prices.osrs.cloud/item/${itemId}) | [Wiki](https://oldschool.runescape.wiki/w/Special:Lookup?type=item&id=${itemId}) | [Price](https://prices.runescape.wiki/osrs/item/${itemId})\n
                        **Volume**: ${formatNumber(itemVolume.volume)} | **Limit**: ${formatNumber(itemDetails.ge_limit)}\n 
                        **Max Profit**: ${formatNumber(Math.abs((itemLatest.high-itemLatest.low)*itemDetails.ge_limit))} \n
                        **GE**: ${officialGE.currentPrice} \n
                        **12hr**: ${formatNumber(twelveHour.avg)} | **1hr**: ${formatNumber(oneHour.avg)} \n \n
                        **Insta Buy**: ${formatNumber(itemLatest.high)} <t:${(itemLatest.hight)}:R> \n
                        **Insta Sell**: ${formatNumber(itemLatest.low)} <t:${(itemLatest.lowt)}:R> \n

                        ` )
                        .setColor('#03fcdb')
                        .setThumbnail(image_url)
                        .addFields(
                            { name: '\u200B', value: '\u200B' },
                        )
                        .setTimestamp();
                        return interaction.reply({ embeds: [embed]})
                    }
         catch (error) {
            console.error(`An error occurred: ${error.message}`);
            await interaction.reply(`An error occurred: ${error.message}`);
        }
    },
};

