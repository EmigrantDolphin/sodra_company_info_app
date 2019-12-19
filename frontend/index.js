
var selectedComboBoxIndex = 0;
var json = [];
const contentDiv = document.getElementById("contentDiv");
const downloadButtonDiv = document.getElementById("downloadButtonDiv");
const tableComboBoxDiv = document.getElementById("tableComboBoxDiv");

async function fetchData(){
    const companyCode = document.getElementById("companyTextField").value;
    
    const response = await fetch("/ass", {
        method: "POST",
        body: JSON.stringify({code: companyCode}),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    json = await response.json(); // [{tableName, tableRows[]}]
    
    if (json.length === 0){
        contentDiv.innerHTML = "Įmonė nerasta";
        downloadButtonDiv.innerHTML = "";
        tableComboBoxDiv.innerHTML = "";
        selectedComboBoxIndex = 0;
        return;
    }
    createTableComboBox();
    createDownloadButton();
    fillCompanyContent();
    
}

function fillCompanyContent(){
    contentDiv.innerHTML = "";
    
    //array of arrays of objects. [tables][{tableName, tableRows[]}]
    for (let j = 0; j < json[selectedComboBoxIndex].tableRows.length; j++){
        contentDiv.innerHTML +=`
        <div>
            ${
                Object.keys(json[selectedComboBoxIndex].tableRows[j]).map((key)=>{
                    return "<div>"+key +": " + json[selectedComboBoxIndex].tableRows[j][key] + ". </div>"
                }).join('')
            }
        </div>
        <hr>
        `;
    }
}

function createDownloadButton(){
    downloadButtonDiv.innerHTML = `
    <button onClick = "downloadCsv()"> Download </button> 
    `;
}

function downloadCsv(){
    
    let outputData = "";
    Object.keys(json[selectedComboBoxIndex].tableRows[0]).forEach((key)=>{ //csv header
        outputData += key + ";";
    });

    for (let i = 0; i < json[selectedComboBoxIndex].tableRows.length; i++){ //csv contents
        outputData += "\n";
        Object.keys(json[selectedComboBoxIndex].tableRows[i]).forEach((key)=>{
            outputData += json[selectedComboBoxIndex].tableRows[i][key] + ";";
        });
    }

    const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputData));
	element.setAttribute('download', `${json[selectedComboBoxIndex].tableName}.csv`);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

async function onCompanyTextFieldKeyUp(){
    const response = await fetch("/boobs", {
        method: "POST",
        body: JSON.stringify({
            unfinishedCode : document.getElementById("companyTextField").value,
            count : 1
        }),
        headers:{
            'Content-Type': 'application/json'
        }
    });
    const respJson = await response.json();
    const codePredictionDiv = document.getElementById("codePredictionDiv");
    if (respJson.length > 0){
        codePredictionDiv.innerHTML = "Galimas įmonės kodas: " + 
            Object.keys(respJson[0]).map((key)=>{
                return respJson[0][key];
            });
    }else
        codePredictionDiv.innerHTML = "";
    
}

function onTableComboBoxChange(){
    const tableComboBox = document.getElementById("tableComboBox");
    selectedComboBoxIndex = tableComboBox.value;
    fillCompanyContent();
}

function createTableComboBox(){
    let texts = [];
    json.forEach((table)=>{texts.push(table.tableName)});

    tableComboBoxDiv.innerHTML = 
    `
    <select onchange="onTableComboBoxChange()" id="tableComboBox">
        ${texts.map((text, index)=>{return `<option value="${index}">${text}</option>`})}
    </select>
    `;
    
}