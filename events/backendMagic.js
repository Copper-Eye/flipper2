const fetch = require('node-fetch');
const fs = require('fs');
const pricesApiUrl = 'https://prices.runescape.wiki/api/v1/osrs/latest';
const { wrapper } = require('./messageWrapper.js')

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
  async function processValidIds(validIds, channel) {
    // Use Promise.all to run wrapper function for each validId concurrently
    const embeds = await Promise.all(validIds.map(async (validId) => {
      const embed = await wrapper(validId);
      return embed;
    }));
  
    // Send the resulting embeds to the channel
    channel.send({ embeds });
  }
  async function runScripts() {
      try {
        // Make a GET request to get additional item details
        const latest = await getLatest();
        const latestOld = readLocalJSON('LatestOld.json');
        const thresholdPercentage = 50;
        const changedEntries = findChangedEntriesWithThreshold(latestOld, latest, thresholdPercentage);
       // setTimeout(saveDatasetToFile, 5000, latest, "LatestOld.json"); // Save entries
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
function oneGpDump(dataset) {
    const result = [];

    dataset.forEach(data => {
        // Check if 'changes' is defined and has 'high' or 'low' equal to 1
        if (
            data.changes &&
            typeof data.changes === 'object' &&
            ('high' in data.changes && data.changes.high === 1) ||
            ('low' in data.changes && data.changes.low === 1)
        ) {
            // Add the ID to the result array
            result.push(data.id);

        }
    });

    return result;
}
async function oneGP(channel){
    try {
        // Make a GET request to get additional item details
        const runningScripts = await runScripts();

        if (runningScripts) {
            const validIDs = oneGpDump(runningScripts.watchIds);
            if (validIDs.length > 0) {
                channel.send(`New IDs to check: ${validIDs}`);
                await processValidIds(validIDs, channel);

            }
        }
    }catch (error) {
    console.error(`An error occurred: ${error.message}`);
}
}


  module.exports = {
    oneGP,
}
