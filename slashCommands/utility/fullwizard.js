const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');

const pricesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/latest';
const mappingApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/mapping';
const volumesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/volumes';



//Some things it needs to do...
//From Latest Price API, needs pull data then do a for loop with each ITEM id.
//Inside this for loop, we need to compare against https://prices.runescape.wiki/api/v1/osrs/5m, https://prices.runescape.wiki/api/v1/osrs/1h
//Can also use https://prices.runescape.wiki/api/v1/osrs/1h?timestamp=1615734000. Timestamp must be divisble by 3600. To find data from previous hour. Get current time, convert to UNIX. Minus 3600 then modulo % 3600. Or 7200 for 2 hours etc.

function HighestOf(x, y) {
    return (x > y) ? x : y;
}

// Function to find the lowest of two numbers
function LowestOf(x, y) {
    return (x < y) ? x : y;
}

async function getLatest() {
    try {
      // Make a GET request to the main OSRS prices API
      const response = await fetch(pricesApiUrl);
  
      // Check if the request was successful (status code 200)
      if (response.ok) {
        const data = await response.json();
  
        // Return the data directly
        return data;
      } else {
        // Handle non-OK response status
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return {
          success: false,
          message: `Error: ${response.status} - ${response.statusText}`,
        };
      }
    } catch (error) {
      // Handle any exceptions that occurred during the fetch or processing
      console.error('Error:', error.message);
      return {
        success: false,
        message: 'An error occurred',
      };
    }
} 
function saveDatasetToFile(dataset, filename) {
    // Check if 'data' property exists in the dataset
    if (!dataset.data) {
      console.error('Error: No "data" property found in the dataset');
      // Handle the error as needed
      return;
    }
  
    // Convert the dataset to a JSON string
    const datasetString = JSON.stringify(dataset);
  
    // Write the JSON string to a file
    fs.writeFileSync(filename, datasetString);
  
    console.log(`Dataset saved to file: ${filename}`);
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
// Helper function to get the changes between two entries
function getChanges(entryOld, entryLatest) {
    // Compare the values you want to get changes for
    const changes = {};
  
    if (entryOld.high !== entryLatest.high) {
      changes.high = entryLatest.high;
    }
  
    if (entryOld.low !== entryLatest.low) {
      changes.low = entryLatest.low;
    }
  
    return changes;
  }
  function findChangedEntries(latestOld, latest) {
  // Check if 'data' property exists in both datasets
  if (!latestOld.data || !latest.data) {
    console.error('Error: No "data" property found in one or both datasets');
    // Handle the error as needed
    return;
  }

  const dataEntriesOld = latestOld.data;
  const dataEntriesLatest = latest.data;

  const changedEntries = [];

  // Loop through the entries in the latest dataset
  for (const id in dataEntriesLatest) {
    if (dataEntriesLatest.hasOwnProperty(id)) {
      const entryLatest = dataEntriesLatest[id];

      // Check if the ID exists in the old dataset
      if (dataEntriesOld.hasOwnProperty(id)) {
        const entryOld = dataEntriesOld[id];

        // Compare values and check if the entry has changed
        if (!compareEntries(entryOld, entryLatest)) {
          const changes = getChanges(entryOld, entryLatest);
          changedEntries.push({
            id,
            previousValues: entryOld,
            currentValues: entryLatest,
            changes,
          });
        }
      }
    }
  }

  return changedEntries;
}
  
function findChangedEntriesWithThreshold(latestOld, latest, thresholdPercentage) {
    // Check if 'data' property exists in both datasets
    if (!latestOld.data || !latest.data) {
      console.error('Error: No "data" property found in one or both datasets');
      // Handle the error as needed
      return;
    }
  
    const dataEntriesOld = latestOld.data;
    const dataEntriesLatest = latest.data;
  
    const changedEntries = [];
  
    // Loop through the entries in the latest dataset
    for (const id in dataEntriesLatest) {
      if (dataEntriesLatest.hasOwnProperty(id)) {
        const entryLatest = dataEntriesLatest[id];
  
        // Check if the ID exists in the old dataset
        if (dataEntriesOld.hasOwnProperty(id)) {
          const entryOld = dataEntriesOld[id];
  
          // Compare values and check if the entry has changed
          if (shouldConsiderChange(entryOld, entryLatest, thresholdPercentage)) {
            const changes = getChanges(entryOld, entryLatest);
            changedEntries.push({
              id,
           //   previousValues: entryOld,
           //   currentValues: entryLatest,
           //   changes,
            });
          }
        }
      }
    }
  
    return changedEntries;
  }
  
  // Helper function to determine if a change should be considered
  function shouldConsiderChange(entryOld, entryLatest, thresholdPercentage) {
    for (const key in entryOld) {
      if (entryOld.hasOwnProperty(key) && typeof entryOld[key] === 'number') {
        // Check if the percentage difference exceeds the threshold
        const percentageDifference = Math.abs((entryLatest[key] - entryOld[key]) / entryOld[key]) * 100;
        if (percentageDifference > thresholdPercentage) {
          return true;
        }
      }
    }
  
    return false;
  }
  async function runScripts() {
      try {
        // Make a GET request to get additional item details
        const latest = await getLatest();
        const latestOld = readLocalJSON('LatestOld.json');
        const thresholdPercentage = 5;
        const changedEntries = findChangedEntriesWithThreshold(latestOld, latest, thresholdPercentage);
        console.log('Changed Entries:', changedEntries);
        //overwrite new changes
        setTimeout(saveDatasetToFile, 5000, latest, "LatestOld.json"); // Hello, John
        return {
            watchIds: changedEntries,
            success: true,
            message: 'Success',
          };
    } catch (error) {
      // Handle any exceptions that occurred during the fetch or processing
      console.error('Error:', error.message);
      return {
        success: false,
        message: 'An error occurred',
      };
    }
} 
  module.exports = {
    name: 'test',
    description: 'Check info of an OSRS item.',
    type: ApplicationCommandType.ChatInput,
    options: [
    ],
    run: async (client, interaction) => {
        console.log("Input /test");
        try {
            // Make a GET request to get additional item details
            const runningScripts = await runScripts();

            if (runningScripts) {
                const data = runningScripts.watchIds;
                // Now you can use the value of watchIds in this function
                for (let i = 0; i < data.length; i++) {
                    const entry = data[i];
                    const id = entry.id;
                    // Your code for each iteration, for example:
                    console.log(`Processing entry with ID: ${id}`);
                    // Add your logic here based on the ID or any other properties
                  }
              } else {
                // Handle the case where runScripts() did not return the expected result
                console.error('Error: runScripts did not return the expected result');
              }



            const embed = new EmbedBuilder()
                        .setTitle(`Outputting to console.`)
                        .setDescription(`good luck
                        ` )
                        .setColor('#03fcdb')
                        .addFields(
                        )
                        .setTimestamp();
                        return interaction.reply({ embeds: [embed]})
                    }
         catch (error) {
            console.error(`An error occurred: ${error.message}`);
            await interaction.reply(`An error occurred: ${error.message}`);
        }
    },
}
