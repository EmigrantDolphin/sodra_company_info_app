const initDB = require('./initDB');
const sodraUpdater = require('./sodraUpdater');
const express = require('express');
const app = express();
const path = require('path');

const PORT = 3212;
let db;

connectToDb();
async function connectToDb(){
    db = await initDB();
    await sodraUpdater.update(db); // this await does nothing FFS
    db.query("USE sodra_info");
}


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(__dirname));
app.get('/', async function(req, res){
    res.sendFile(path.join(__dirname,'index.html'));
});

app.post('/ass', async function(req, res){
    console.log(req.body);
    let ans = []
    for (let i = 0; i < sodraUpdater.tableData.length; i++){
        const sql =`
        SELECT * 
        FROM ${sodraUpdater.tableData[i].tableName} 
        WHERE \`${sodraUpdater.tableData[i].columnNames[0]}\` = '${req.body.code}'
        `;
        await db.query(sql, (err1, res1)=>{
            if (err1){
                console.error(err);
                return;
            }
            ans[i] = res1;
        });
    }
    res.send(ans);
});


app.listen(PORT, () => console.log(`Server app listening on port ${PORT}!`));