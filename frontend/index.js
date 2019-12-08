
async function fetchData(){
    const companyCode = document.getElementById("companyTextField").value;
    
    const response = await fetch("/ass", {
        method: "POST",
        body: JSON.stringify({code: companyCode}),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();
    
    const contentDiv = document.getElementById("companyContent");
    contentDiv.innerHTML = "";
    
    if (json.length === 0){
        contentDiv.innerHTML += "Įmonė nerasta";
        return;
    }
    for (let i = 0; i < json.length; i++){
        contentDiv.innerHTML +=`
        <div>
            ${Object.keys(json[i]).map((key)=>{return "<div>"+key +": " + json[i][key] + ". </div>"}).join('')}
        </div>
        <hr>
        `
    }
    
}

function onCompanyTextFieldKeyUp(){
    console.log(document.getElementById("companyTextField").value);
}