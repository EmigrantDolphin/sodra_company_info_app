const mysql = require('mysql');
const readline = require('readline');

async function connect(){
    let mysqlCon;
    let dbHost, dbUser, dbPass;
    console.log("__database info__\n");
    //dbHost = await consoleQuestion("db Host: ");
    //dbUser = await consoleQuestion("db User: ");
    //dbPass = await consoleQuestion("db Password: ");
    mysqlCon = await connectToMysql("localhost", "root", "uncrackablePassword");

    return mysqlCon
}

function connectToMysql(host, user, pass){
    return new Promise((resolve, reject) => {
        mysqlCon = mysql.createConnection({
            host: host,
            user: user,
            password: pass
        });
    
        mysqlCon.connect((err) => {
            if (err) {
                console.error("can't connect: "+ err.message);
                return;
            }
            console.log("connected to DB!!");
            resolve(mysqlCon);
        });
    });
    
}

async function consoleQuestion (question){
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

module.exports = connect;