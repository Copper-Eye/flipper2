//Graph view data for 1D and 7D.
//Run latest every minute. If latest value is a high differential to the 5m before previous then flag as dump and automatically send notif.
//Decide if its worth creating local database to store values to.
//Set up margin % and other info about item.
//Implement Tax.
//Build in long term and short term trend list.

const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');

const pricesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/latest';
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
                    //console.log(item_info);

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
function readLocalJSON(filename) {
    try {
      // Read the contents of the JSON file
      const fileContents = fs.readFileSync(filename, 'utf8');
  
      // Parse the JSON data
      const jsonData = JSON.parse(fileContents);
  
      return jsonData;
    } catch (error) {
      console.error(`Error reading or parsing JSON file: ${error.message}`);
      // Handle the error as needed
      return null;
    }
  }
  function getItemDetailsById(itemId) {
        const masterList = readLocalJSON('masterList.json');

        // Log masterList for debugging
        for (const item of masterList) {
            if (String(item.id) === itemId) {
              //  console.log('Found matching item:', item);
                return {
                    'name': item.name,
                    'members': item.members,
                    'volume': item.volume,
                    'low_alch': item.lowalch || 'N/A',
                    'high_alch': item.highalch || 'N/A',
                    'value': item.value || 'N/A',
                    'limit': item.limit || 'N/A',
                    'img_url': item.img_url || 'N/A',
                };
            }
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
  function HighestOf(x, y) {
    return (x > y) ? x : y;
}

// Function to find the lowest of two numbers
function LowestOf(x, y) {
    return (x < y) ? x : y;
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
            const itemLatest = await getLatestPrices(itemId);
            const oneHour = await getOneHour(itemId);
            const twelveHour = await getTwelveHour(itemId);
            const officialGE = await getOfficialGEStats(itemId);
            const itemDetails = getItemDetailsById(itemId);
                        // Send the information to the Discord channel using an embed
                        //Max profit = Highest( 12hr Average 1hr avg) - lowerst(Instabuy or Instasell) time limit usually lowest, rounded down. Then apply tax.
                        const embed = new EmbedBuilder()
                        .setTitle(`${itemDetails.name} - ID: ${itemId}`)
                        .setDescription(`[Osrs.cloud](https://prices.osrs.cloud/item/${itemId}) | [Wiki](https://oldschool.runescape.wiki/w/Special:Lookup?type=item&id=${itemId}) | [Price](https://prices.runescape.wiki/osrs/item/${itemId})\n
                        **Volume**: ${formatNumber(itemDetails.volume)} | **Limit**: ${formatNumber(itemDetails.limit)}\n 
                        **Max Profit**: ${formatNumber(Math.abs((HighestOf(twelveHour.avg, oneHour.avg) - LowestOf(itemLatest.high, itemLatest.low))*itemDetails.limit))} \n
                        **GE**: ${officialGE.currentPrice} \n
                        **12hr**: ${formatNumber(twelveHour.avg)} | **1hr**: ${formatNumber(oneHour.avg)} \n \n
                        **Insta Buy**: ${formatNumber(itemLatest.high)} <t:${(itemLatest.hight)}:R> \n
                        **Insta Sell**: ${formatNumber(itemLatest.low)} <t:${(itemLatest.lowt)}:R> \n
                        ` )
                        .setColor('#03fcdb')
                        .setThumbnail(itemDetails.img_url)
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

