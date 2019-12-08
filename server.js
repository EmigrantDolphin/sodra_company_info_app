const initDB = require('./initDB');
const sodraUpdater = require('./sodraUpdater');
const express = require('express');
const app = express();
const path = require('path');

const PORT = 3212;
let db;

main();
async function main(){
    db = await initDB();
    await sodraUpdater.update(db); // this await does nothing FFS
    db.query("USE sodra_info");
    app.listen(PORT, () => console.log(`Server app listening on port ${PORT}!`));
}


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(__dirname));
app.get('/', async function(req, res){
    res.sendFile(path.join(__dirname,'index.html'));
});

app.post('/ass', async function(req, res){
    console.log(req.body);
    
    getInfo(req).then((ans)=>{
        console.log(ans);
        res.send(ans);
    });

});

function getInfo(req){
    return new Promise(async (resolve, reject)=>{
        const tableData = await sodraUpdater.getTableData();
        let ans = [];
        for (let i = 0; i < tableData.length; i++){
            const sql =`
            SELECT * 
            FROM ${tableData[i].tableName} 
            WHERE \`${tableData[i].columnNames[0]}\` = '${req.body.code}'
            `;
            db.query(sql, (err1, res1)=>{
                if (err1){
                    console.error(err1);
                    return;
                }
                if (res1.length !== 0){
                    ans[i] = {
                        tableName : tableData[i].tableName,
                        tableRows : res1
                    }
                }
                if (i === tableData.length-1)
                    resolve(ans);
            });
        }
    });
}
