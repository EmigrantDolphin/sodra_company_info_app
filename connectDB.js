const mysql = require('mysql');


async function connect(dbLoginInfo){
    return await connectToMysql(dbLoginInfo.host, dbLoginInfo.user, dbLoginInfo.password);
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
                resolve(null);
                return;
            }
            console.log("connected to db: " + host);
            resolve(mysqlCon);
        });
    });
    
}

module.exports = connect;