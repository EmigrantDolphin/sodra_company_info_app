const readline = require('readline');
const streamZip = require('node-stream-zip');
const fs = require('fs');
const http = require('http');


var securePath = "";
const URLFILE = "./fileUrls.json";
const TABLEDATAFILE = "./tableData.json";

function getTableData(){
    return new Promise((resolve, reject)=>{
        const rawdata = fs.readFileSync(TABLEDATAFILE);
        const tableData = JSON.parse(rawdata);
        resolve(tableData);
    });
}

async function update(mysqlCon){
    await createDatabaseIfNotExists("sodra_info", mysqlCon);
    securePath = await getSecurePath(mysqlCon);
    updateMysql(mysqlCon);
}

function getSecurePath(mysqlCon){
    return new Promise((resolve, reject)=>{
        mysqlCon.query("SHOW VARIABLES LIKE 'secure_file_priv'", (err, res)=>{
            resolve(res[0].Value);
        });    
    });
}


async function createDatabaseIfNotExists(name, mysqlCon){
    return new Promise((resolve, reject)=>{
        let sql = `CREATE DATABASE IF NOT EXISTS ${name}`;
        mysqlCon.query(sql, (err, res)=>{
            if (err){
                console.error(err.message);
                return;
            }
            sql = `USE ${name}`;
            mysqlCon.query(sql,(err1, res1)=>{
                if (err){
                    console.error(err.message);
                    return;
                }
                resolve();
            });
            
        });
    });
}

function updateMysql(mysqlCon){
    const rawdata = fs.readFileSync(URLFILE);
    const urlFileData = JSON.parse(rawdata);

    for (let i = 0; i < urlFileData.length; i++){
        const file = fs.createWriteStream(urlFileData[i].tableName+".zip");
        console.log("Downloading: "+urlFileData[i].url);
        http.get(urlFileData[i].url, (res) => {
            res.pipe(file);
        });
        file.on('close', ()=>{
            console.log("Downloaded: "+urlFileData[i].url);
            zipToMysql(urlFileData[i].tableName+".zip", urlFileData[i], mysqlCon);
        });
    }
    
}

function zipToMysql (zipPath, urlFileData, mysqlCon){
    var zip = new streamZip({
        file: zipPath,
        storeEntries: true
    });
    
    zip.on('error', err => {console.error(err);});
    zip.on('entry', function (entry){
        console.log("unzipping: " + entry.name);
        zip.stream(entry.name, (err, stream) => {
            if (err){
                console.error("Error while streaming: " + err);
                return;
            }
            stream.pipe(fs.createWriteStream(securePath+entry.name))
            .on('finish', ()=>{
                console.log("unzipped to: "+entry.name);
                loadFileToDatabase(entry.name, urlFileData, mysqlCon).then(()=>{
                    fs.unlink(securePath+entry.name, (err)=>{if (err) console.error(err)});
                    fs.unlink(zipPath, (err)=>{if (err) console.error(err)});
                });
                
            })
            
        });
    });
}

async function loadFileToDatabase(fileName, urlFileData, mysqlCon){
    columnNames = await getColumnNamesCsv(securePath+fileName);
    // append table data to file     
    const tableData = {
        tableName : urlFileData.tableName,
        columnNames : columnNames
    }
    const rawdata = fs.readFileSync(TABLEDATAFILE);
    const fileTableData = JSON.parse(rawdata);
    if (!fileTableData.includes(tableData)){
        fileTableData.push(tableData);
        fs.writeFileSync(TABLEDATAFILE, JSON.stringify(fileTableData));
    }
    
    //loading to sql 
    let sql = `
    DROP TABLE IF EXISTS ${urlFileData.tableName}
    `;
    await sqlQuery(mysqlCon, sql);
    //////
    sql = `
    CREATE TABLE IF NOT EXISTS ${urlFileData.tableName} 
    (${ await getColumnInstantiations(columnNames)})
    `;
    await sqlQuery(mysqlCon, sql);
    /////
    sql = `
    CREATE INDEX dk_code ON ${urlFileData.tableName} (\`${columnNames[0]}\`)
    `;
    await sqlQuery(mysqlCon, sql);
    //////
    console.log("Loading data to db table: "+urlFileData.tableName);
    sql = `
    LOAD DATA INFILE ? 
    INTO TABLE ${urlFileData.tableName} 
    FIELDS TERMINATED BY ';'
    ENCLOSED BY '\"'
    LINES TERMINATED BY '\\n' 
    IGNORE 1 ROWS
    `;
    await sqlQuery(mysqlCon, sql,[securePath+fileName]);
    console.log("Data loaded to: "+urlFileData.tableName);
}

function sqlQuery(mysqlCon, sql, params){
    return new Promise((resolve, reject)=>{
        mysqlCon.query(sql, params, (err, res)=>{
            if (err){
                console.log(err);
                return;
            }
            resolve();
        });
    });
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

function getColumnInstantiations(columnNames){ //string of varchar tables separated by comma
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


module.exports = {
    update : update,
    getTableData : getTableData
};