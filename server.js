const sodraDB = require('./sodraDB');
const express = require('express');
const app = express();
const path = require('path');

const PORT = 3212;

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(__dirname));


main();
async function main(){
    await sodraDB.init();
    sodraDB.update();
    setUpdateAtMidnight();
    app.listen(PORT, () => console.log(`Server app listening on port ${PORT}!`));
}

function setUpdateAtMidnight(){
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0
    );

    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(()=>{
        sodraDB.update();
        setUpdateAtMidnight();
    }, msToMidnight);
}

app.get('/', async function(req, res){
    res.sendFile(path.join(__dirname,'index.html'));
});

app.post('/companyInfo', async function(req, res){
    getInfo(req).then((ans)=>{
        //console.log(ans[0]);
        res.send(ans);
    });
});

app.post('/companyCodePrediction', async function(req, res){
    getFullCodes(req.body.unfinishedCode, req.body.count).then((ans)=>{
        res.send(ans);
    });
});

async function getInfo(req){
    const tableData = await sodraDB.getTableData();
    let ans = [];
    for (let i = 0; i < tableData.length; i++){
        const sql =`
        SELECT * 
        FROM ${tableData[i].tableName} 
        WHERE \`${tableData[i].columnNames[0]}\` = '${req.body.code}'
        `;

        const queryRes = await sodraDB.query(sql);
        if (queryRes.length !== 0)
            ans[i] = {
                tableName : tableData[i].tableName,
                tableRows : queryRes
            }
        
        if (i === tableData.length-1)
            return ans;
        
    }
}

async function getFullCodes(unfinishedCode, count){

    const tableData = await sodraDB.getTableData();
    if (tableData.length === 0)
        return []; 
    const sql = `
    SELECT \`${tableData[0].columnNames[0]}\`
    FROM \`${tableData[0].tableName}\`
    WHERE \`${tableData[0].columnNames[0]}\` LIKE '${unfinishedCode}%'
    LIMIT ${count}
    `;
    return await sodraDB.query(sql);


}


