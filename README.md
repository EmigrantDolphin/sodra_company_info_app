# Sodra "info about company" app
Project for BA Challenge <br>

## Installation
#### `npm install` 
to install dependencies <br>
#### `npm start` 
to run the app <br><br>
App will ask for ```localhost```, ```user``` and ```password``` of the database

## to do
prettier frontend? <br>
proper error handling? <br>

## info
Server starts on http://localhost:3212/
### be aware
On first launch, 2 files (add more in fileUrls.json) will download and load to DB. <br>
first file (daily_2019_10) loads to db in about 4 minutes with ssd. (old cpu)<br>
second file (montly_2019) loads in about 1 minute.

### database
App: <br> 
uses MySQL.<br>
creates schema called "sodra_info" on first launch.<br>
uses 'secure_file_priv' path for `LOAD DATA INFILE` (loading file to db)<br>
uses `DROP`, `CREATE`, `RENAME`, `SELECT`, `USE` and `LOAD DATA INFILE` sql commands

### db updating
```fileUrls.json``` contains info about 'sodra' files. Which ones are loaded to db and which ones are to be updated daily. Currently ```dailyUpdate``` parameter needs to be changed manually. <br>
Tables with ```dailyUpdate``` param are updated daily at midnight or when server is launched second+ time <br>
<br>
```tableData.json``` contents are filled automatically with table and column names for storing and easy access.
<br>

