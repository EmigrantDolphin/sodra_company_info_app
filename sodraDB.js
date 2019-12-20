const readline = require('readline');
const streamZip = require('node-stream-zip');
const fs = require('fs');
const http = require('http');
const connectDB = require('./connectDB');

const URLFILE = "./fileUrls.json";
const TABLEDATAFILE = "./tableData.json";
const DBNAME = "sodra_info";

let updateConnection; // for loading files to db
let queryConnection;  // for web page queries
let updating = false; //make sure only one update at a time

let dbLoginInfo = {  // {host, user, password}
    host : "localhost",
    user : "root",
    password : "uncrackablePassword" 
}; 

function getTableData(){
    return new Promise((resolve, reject)=>{
        const rawdata = fs.readFileSync(TABLEDATAFILE);
        const tableData = JSON.parse(rawdata);
        resolve(tableData);
    });
}

function getUrlFileData(){
    return new Promise((resolve, reject)=>{
        const rawdata = fs.readFileSync(URLFILE);
        const urlFileData = JSON.parse(rawdata);
        resolve(urlFileData);
    });
}

async function init(){
    updateConnection = null;
    while(updateConnection === null){ //make sure login info is correct
        console.log("__database info__\n");
        dbLoginInfo.host = await consoleQuestion("db Host: ");
        dbLoginInfo.user = await consoleQuestion("db User: ");
        dbLoginInfo.password = await consoleQuestion("db Password: ");
        updateConnection = await connectDB(dbLoginInfo);
    }
    await createDatabaseIfNotExists(DBNAME, updateConnection);

    queryConnection = await connectDB(dbLoginInfo);
    await sqlQuery(queryConnection, `USE ${DBNAME}`);
}

async function update(){
    if (updating)
        return;
    updating = true;
    const mysqlCon = updateConnection;
    await sqlQuery(mysqlCon, `USE ${DBNAME}`);
    const secureFolderPath = await getSecurePath(mysqlCon);
    const urlFileData = await getUrlFileData();
    let updateUrlFileData = false;

    for(let i = 0; i < urlFileData.length; i++)
        if (!urlFileData[i].loaded){ //file not in DB
            const downloadFilePath = urlFileData[i].tableName + ".zip";
            
            await downloadFile(urlFileData[i].url, downloadFilePath);
            const unzippedFileName = await unzipFile(downloadFilePath, secureFolderPath);
            const columnNames = await getColumnNamesCsv(secureFolderPath + unzippedFileName);
            await loadToDB(secureFolderPath + unzippedFileName, urlFileData[i].tableName, columnNames, mysqlCon);
            await appendToTableDataFile(urlFileData[i].tableName, columnNames);
            
            urlFileData[i].loaded = true;
            deleteFile(secureFolderPath + unzippedFileName);
            deleteFile(downloadFilePath);
            updateUrlFileData = true;
        }else if (urlFileData[i].dailyUpdate){ //file in DB and needs daily update
            const downloadFilePath = urlFileData[i].tableName + ".zip";
            const tempTableName = "TEMP";
            
            await downloadFile(urlFileData[i].url, downloadFilePath);
            const unzippedFileName = await unzipFile(downloadFilePath, secureFolderPath)
            const columnNames = await getColumnNamesCsv(secureFolderPath + unzippedFileName);

            await loadToDB(secureFolderPath + unzippedFileName, tempTableName, columnNames, mysqlCon);
            
            sql = `DROP TABLE IF EXISTS \`${urlFileData[i].tableName}\``
            await sqlQuery(mysqlCon, sql);
            console.log(`Dropped table: ${urlFileData[i].tableName}`);

            sql = `RENAME TABLE \`${tempTableName}\` TO ${urlFileData[i].tableName}`;
            await sqlQuery(mysqlCon, sql);
            console.log(`Renamed table from [${tempTableName}] to [${urlFileData[i].tableName}]`);

            deleteFile(secureFolderPath + unzippedFileName);
            deleteFile(downloadFilePath);
        }
    if (updateUrlFileData)
        fs.writeFileSync(URLFILE, JSON.stringify(urlFileData, null, 4));
    updating = false;
}

function appendToTableDataFile(tableName, columnNames){
    return new Promise(async (resolve, reject)=>{
        const tableData = {
            tableName : tableName,
            columnNames : columnNames
        }
        const fileTableData = await getTableData();
        fileTableData.push(tableData);
        fs.writeFileSync(TABLEDATAFILE, JSON.stringify(fileTableData, null, 4));

        resolve();
    });
}

function getSecurePath(mysqlCon){
    return new Promise((resolve, reject)=>{
        mysqlCon.query("SHOW VARIABLES LIKE 'secure_file_priv'", (err, res)=>{
            resolve(res[0].Value);
        });    
    });
}

function deleteFile(filePath){
    fs.unlink(filePath, (err) => {
        if (err){
            console.error(err);
            return;
        }
        console.log("Deleted: " + filePath);
    });
}

async function createDatabaseIfNotExists(name, mysqlCon){
    let sql = `CREATE DATABASE IF NOT EXISTS ${name}`;
    await sqlQuery(mysqlCon, sql);

    sql = `USE ${name}`;
    await sqlQuery(mysqlCon, sql);
}

function downloadFile(fileUrl, fileName){
    return new Promise((resolve, reject) => {        
        const file = fs.createWriteStream(fileName);
        console.log("Downloading " + fileUrl);
        http.get(fileUrl, async (res) =>{
            res.pipe(file);
        });
        file.on("close", () =>{
            console.log("Downloaded: " + fileUrl);
            resolve();
        });
    });
}

function unzipFile(zipPath, unzipFolderPath){
    return new Promise((resolve, reject) => {
        const zip = new streamZip({
            file: zipPath,
            storeEntries: true
        })
        
        zip.on("error", err => {console.error(err);});
        zip.on("entry", (entry) => {
            console.log("unzipping: " + entry.name);
            zip.stream(entry.name, (err, stream) => {
                if (err){
                    console.error(err);
                    resolve();
                }

                stream.pipe(fs.createWriteStream(unzipFolderPath + entry.name))
                .on("finish", () => {
                    console.log("unzipped to: " + unzipFolderPath + entry.name);
                    resolve(entry.name);
                });
            });
        });
    });
}

async function loadToDB(filePath, tableName, columnNames, mysqlCon){
    //loading to sql 

    let sql = `DROP TABLE IF EXISTS \`${tableName}\``;
    await sqlQuery(mysqlCon, sql);
    /////
    sql = `
    CREATE TABLE IF NOT EXISTS ${tableName} 
    (${ await getColumnInstantiations(columnNames)})
    `;
    await sqlQuery(mysqlCon, sql);
    /////
    sql = `
    CREATE INDEX dk_code ON ${tableName} (\`${columnNames[0]}\`)
    `;
    await sqlQuery(mysqlCon, sql);
    //////
    console.log("Loading data to db table: "+tableName);
    const queryStart = new Date();
    sql = `
    LOAD DATA CONCURRENT INFILE ? 
    INTO TABLE ${tableName} 
    FIELDS TERMINATED BY ';'
    ENCLOSED BY '\"'
    LINES TERMINATED BY '\\n' 
    IGNORE 1 ROWS
    `;
    await sqlQuery(mysqlCon, sql,[filePath]);
    console.log("Data loaded to: "+tableName);
    const deltaTime = new Date() - queryStart;
    console.log(`Time spent: ${deltaTime/1000}s`);
}

function sqlQuery(mysqlCon, sql, params){
    return new Promise((resolve, reject)=>{
        mysqlCon.query(sql, params, (err, res)=>{
            if (err){
                console.error(err);
                return;
            }
            resolve(res);
        });
    });
}

async function query(sql, params){
    return await sqlQuery(queryConnection, sql, params);
}

function getColumnNamesCsv(fullPath){
    return new Promise((resolve, reject)=>{
        const readInterface = readline.createInterface({
            input: fs.createReadStream(fullPath),
            console: false
        });
 
        readInterface.on('line', (line)=>{
            const columnNames = line.split(";");
            let answer = [];
            for (let i = 0; i < columnNames.length; i++){
                columnNames[i] = columnNames[i].replace(/\s+/g, '_');
                answer[i] = columnNames[i];
            }
            readInterface.close();
            resolve(answer);
        });  
    });
}

function getColumnInstantiations(columnNames){ //string of columns with varchar(255) separated by comma
    return new Promise((resolve, reject)=>{
        let answer = "";
        for (let i = 0; i < columnNames.length; i++){
            answer += "`"+columnNames[i]+"`" + " varchar(255)";
            if (i < columnNames.length-1)
                answer += ",";
        }
        resolve(answer);  
    });
}

function consoleQuestion (question){
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    
        rl.question(question, (ans) => {
            rl.close();
            resolve(ans);
        });
    });
}


module.exports = {
    update : update,
    getTableData : getTableData,
    init : init,
    query : query
};