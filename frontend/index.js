
var selectedComboBoxIndex = 0;
var companyData = []; // [{tableName, tableRows[]}]
const contentDiv = document.getElementById("contentDiv");
const downloadButtonDiv = document.getElementById("downloadButtonDiv");
const tableComboBoxDiv = document.getElementById("tableComboBoxDiv");

async function fetchData(){
    const companyCode = document.getElementById("companyTextField").value;
    
    const response = await fetch("/companyInfo", {
        method: "POST",
        body: JSON.stringify({code: companyCode}),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    companyData = await response.json(); // [{tableName, tableRows[]}]
    
    if (companyData.length === 0){
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
    for (let j = 0; j < companyData[selectedComboBoxIndex].tableRows.length; j++){
        contentDiv.innerHTML +=`
        <div>
            ${
                Object.keys(companyData[selectedComboBoxIndex].tableRows[j]).map((key)=>{
                    return "<div>"+key +": " + companyData[selectedComboBoxIndex].tableRows[j][key] + ". </div>"
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
    Object.keys(companyData[selectedComboBoxIndex].tableRows[0]).forEach((key)=>{ //csv header
        outputData += key + ";";
    });

    for (let i = 0; i < companyData[selectedComboBoxIndex].tableRows.length; i++){ //csv contents
        outputData += "\n";
        Object.keys(companyData[selectedComboBoxIndex].tableRows[i]).forEach((key)=>{
            outputData += companyData[selectedComboBoxIndex].tableRows[i][key] + ";";
        });
    }

    const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputData));
	element.setAttribute('download', `${companyData[selectedComboBoxIndex].tableName}.csv`);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

async function onCompanyTextFieldKeyUp(){
    const response = await fetch("/companyCodePrediction", {
        method: "POST",
        body: JSON.stringify({
            unfinishedCode : document.getElementById("companyTextField").value,
            count : 1
        }),
        headers:{
            'Content-Type': 'application/json'
        }
    });
    const codePrediction = await response.json();
    const codePredictionDiv = document.getElementById("codePredictionDiv");
    if (codePrediction.length > 0){
        codePredictionDiv.innerHTML = "Galimas įmonės kodas: " + 
            Object.keys(codePrediction[0]).map((key)=>{
                return codePrediction[0][key];
            });
    }else
        codePredictionDiv.innerHTML = "Galimas įmonės kodas nerastas";
}

function onTableComboBoxChange(){
    const tableComboBox = document.getElementById("tableComboBox");
    selectedComboBoxIndex = tableComboBox.value;
    fillCompanyContent();
}

function createTableComboBox(){
    let texts = [];
    companyData.forEach((table)=>{texts.push(table.tableName)});

    tableComboBoxDiv.innerHTML = 
    `
    <select onchange="onTableComboBoxChange()" id="tableComboBox">
        ${texts.map((text, index)=>{return `<option value="${index}">${text}</option>`})}
    </select>
    `;
}