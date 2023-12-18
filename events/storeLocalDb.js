const fetch = require('node-fetch');
const fs = require('fs');

function saveDatasetToFile(dataset, filename) {
    // Check if 'data' property exists in the dataset
    if (!dataset.data) {
      console.error('Error: No "data" property found in the dataset');
      // Handle the error as needed
      return;
    }
  
    // Convert the dataset to a JSON string
    const compress = minifyDataset(dataset);
  
    // Write the JSON string to a file
    fs.writeFileSync(filename, compress);
  
    console.log(`Dataset saved to file: ${filename}`);
  }
  function minifyDataset(dataset) {
    return JSON.stringify(dataset).replace(/\s/g, ''); // Removes all whitespace characters
  }
  async function saveLocalDB() {
    try {
      const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest');
        if (response.ok){
            const data = await response.json();
            saveDatasetToFile(data, 'LatestOld.json');
        }else{
            console.error('Error serving API to update local latestDb.');
        }
    } catch (error) {
      console.error(`An error occurred during saveLocalDB(): ${error.message}`);
      return null;
    }
  }
  module.exports = {
    saveLocalDB,
  }