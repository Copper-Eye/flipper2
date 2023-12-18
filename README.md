Recent updates:
- Instead of writing data to file every minute, now stores old data in memory, saves huge amounts of I/O.
- Added wrapper function for messages to send to a specific channel
- Completed the oneGPDump() function. 


To do:
- Function to create filters and checks to data. e.g: datasetFilter(frequently_traded (boolean from comparing limits to daily volume),,  
-  Accomodate GE tax in total profit.
-  Find elegant way to fix/match averages more accurately. Maybe storing data in db will help to perform more complex algorithms. 
