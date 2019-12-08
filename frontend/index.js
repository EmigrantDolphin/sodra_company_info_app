
var selectedComboBoxIndex = 0;
var json = [];

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
        contentDiv.innerHTML += "Įmonė nerasta";
        return;
    }
    createTableComboBox();
    fillCompanyContent();
    
}

function fillCompanyContent(){
    const contentDiv = document.getElementById("companyContent");
    contentDiv.innerHTML = "";
    //array of arrays of objects. [tables][{tableName, rows[]}]
    for (let j = 0; j < json[selectedComboBoxIndex].tableRows.length; j++){
        contentDiv.innerHTML +=`
        <div>
            ${Object.keys(json[selectedComboBoxIndex].tableRows[j]).map((key)=>{return "<div>"+key +": " + json[selectedComboBoxIndex].tableRows[j][key] + ". </div>"}).join('')}
        </div>
        <hr>
        `
    }
}

function onCompanyTextFieldKeyUp(){
    //console.log(document.getElementById("companyTextField").value);
}

function onTableComboBoxChange(){
    const tableComboBox = document.getElementById("tableComboBox");
    selectedComboBoxIndex = tableComboBox.value;
    fillCompanyContent();
}

function createTableComboBox(){
    const tableComboBoxDiv = document.getElementById("tableComboBoxDiv");
    tableComboBoxDiv.innerHTML = "";
    let texts = [];
    json.forEach((table)=>{texts.push(table.tableName)});

    tableComboBoxDiv.innerHTML += 
    `
    <select onchange="onTableComboBoxChange()" id="tableComboBox">
        ${texts.map((text, index)=>{return `<option value="${index}">${text}</option>`})}
    </select>
    `;
    
}