const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');


function saveDatasetToFile(dataset, filename) {
    // Convert the dataset to a JSON string
    const datasetString = JSON.stringify(dataset, null, 2); // The third argument (2) adds indentation for better readability
    
    // Write the JSON string to a file
    fs.writeFileSync(filename, datasetString);
    
    console.log(`Dataset saved to file: ${filename}`);
  }
  function minifyDataset(dataset) {
    return JSON.stringify(dataset).replace(/\s/g, ''); // Removes all whitespace characters
  }
  function mergeDatasets(dataset1, dataset2) {
    // Create a mapping of names to their corresponding values from the second dataset
    const nameToValueMap = {};
    Object.keys(dataset2).forEach((key) => {
      if (key !== "%LAST_UPDATE%" && key !== "%LAST_UPDATE_F%") {
        nameToValueMap[key] = dataset2[key];
      }
    });
  
    // Update values in the first dataset based on the mapping
    const mergedDataset = dataset1.map((item) => {
      const newName = item.name;
      const newValue = nameToValueMap[newName];
      return newValue !== undefined ? { ...item, value: newValue } : item;
    });
  
    return mergedDataset;
  }

module.exports = {
    name: 'updatemetadata',
    description: 'Update Locally Stored Item Metadata',
    type: ApplicationCommandType.ChatInput,
    options: [
    ],
    run: async (client, interaction) => {
        console.log("Input /updatemetadata");
        try {
            // Make a GET request to get additional item details
            const desiredProperties = ["id", "name", "lowalch", "highalch", "members"];
            const response2 = await fetch('https://oldschool.runescape.wiki/?title=Module:GELimits/data.json&action=raw&ctype=application%2Fjson');
            const response3 = await fetch('https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/data/items/items-cache-data.json');
            const response4 = await fetch('https://prices.runescape.wiki/api/v1/osrs/volumes');
            if (response2.ok) {
              const data2 = await response2.json();
              const data3 = await response3.json();
              const data4 = await response4.json();
          
              // Filter and map items based on the value of "tradeable_on_ge" and keep only desired properties
              data3clean = Object.values(data3)
                  .filter(item => item && item.tradeable_on_ge)
                  .map(item => {
                      const filteredItem = {};
                      desiredProperties.forEach(prop => {
                          // Check if the property exists before accessing it
                          filteredItem[prop] = item[prop] !== undefined ? item[prop] : null;
                      });
                      return filteredItem;
                  });
          
              let masterList = mergeDatasets(data3clean, data2);
          
              const data4Entries = Object.entries(data4.data);

              // Iterate through each entry in data4Entries
              for (const [id, volume] of data4Entries) {
                  // Find the index of the item with the same id in masterList
                  const index = masterList.findIndex(item => item.id === parseInt(id, 10));
              
                  // If a match is found, add the 'volume' property to the masterList item
                  if (index !== -1) {
                      masterList[index].volume = volume;
                  }
              }
              // Iterate through each item in the masterList and add the "icon" property while renaming "value" to "limit"
              masterList = masterList.map(item => {
                  // Create the "icon" property based on the specified transformations
                  const img_url = 'https://oldschool.runescape.wiki/images/' + item.name.replace(/\ /g, '_').replace(/\(/g, '%28').replace(/\)/g, '%29') + '_detail.png?7263b';
          
                  // Rename the "value" property to "limit"
                  const { value, ...rest } = item; // Destructure to remove "value"
                  const newItem = { ...rest, limit: value, img_url, volume: item.volume }; // Add "limit," "icon," and "volume"
          
                  // Return the updated object
                  return newItem;
              });
                    saveDatasetToFile((masterList), "masterList.json");

            } else {
                console.error(`Error: Error connecting to one of the APIs`);
                return null;
            }
                        // Send the information to the Discord channel using an embed
                        //Max profit = Highest( 12hr Average 1hr avg) - lowerst(Instabuy or Instasell) time limit usually lowest, rounded down. Then apply tax.
                        const embed = new EmbedBuilder()
                        .setTitle(`Metadata Built successfully`)
                        .setDescription(`Rebuilt: [id, name, volume, highalch, lowalch, limit, members, imgUrl] 

                        ` )
                        .setColor('#20fc03')
                        .setTimestamp();
                        return interaction.reply({ embeds: [embed]})
                    }
         catch (error) {
            console.error(`An error occurred: ${error.message}`);
            await interaction.reply(`An error occurred: ${error.message}`);
        }
    },
};