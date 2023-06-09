const selectAddressFactu = document.querySelector("#address-factu");

const nameAddressFactu = document.querySelector("#nomAdresseFactu");
const rueFactu = document.querySelector("#rueFactu");
const villeFactu = document.querySelector("#villeFactu");
const paysFactu = document.querySelector("#paysFactu");
const regionFactu = document.querySelector("#regionFactu");
const complementFactu = document.querySelector("#complementFactu");
const codepostalFactu = document.querySelector("#codepostalFactu");

selectAddressFactu.onchange = function() {
    const addressIdFactu = selectAddressFactu.value;
    updateDisplayFactu(addressIdFactu) 
}

function updateDisplayFactu(addressIdFactu) {
    fetch("/getAdresse/"+addressIdFactu).then(function(response){
        response.json().then(function(obj) {
            nameAddressFactu.value = obj.adresse.nom;
            rueFactu.value = obj.adresse.rue;
            villeFactu.value = obj.adresse.ville;
            paysFactu.value = obj.adresse.pays;
            regionFactu.value = obj.adresse.region;
            complementFactu.value = obj.adresse.complement;
            codepostalFactu.value = obj.adresse.cp;
        })
    })
}



const selectAddress = document.querySelector("#address");

const nameAddress = document.querySelector("#nomAdresse");
const rue = document.querySelector("#rue");
const ville = document.querySelector("#ville");
const pays = document.querySelector("#pays");
const region = document.querySelector("#region");
const complement = document.querySelector("#complement");
const codepostal = document.querySelector("#codepostal");

selectAddress.onchange = function() {
    const addressId = selectAddress.value;
    updateDisplayAddress(addressId) 
}


function updateDisplayAddress(addressId) {
    fetch("/getAdresse/"+addressId).then(function(response){
        response.json().then(function(obj) {
            nameAddress.value = obj.adresse.nom;
            rue.value = obj.adresse.rue;
            ville.value = obj.adresse.ville;
            pays.value = obj.adresse.pays;
            region.value = obj.adresse.region;
            complement.value = obj.adresse.complement;
            codepostal.value = obj.adresse.cp;
        })
    })
}


const selectPaiements = document.querySelector("#paiements");

const nomCard = document.querySelector("#nomCard");
const fullname = document.querySelector("#fullname");
const cardnumber = document.querySelector("#cardnumber");
const expiration = document.querySelector("#expiration");
const cvv = document.querySelector("#cvv");

selectPaiements.onchange = function() {
    const cardId = selectPaiements.value;
    updateDisplayCard(cardId) 
}


function updateDisplayCard(cardId) {
    fetch("/getCard/"+cardId).then(function(response){
        response.json().then(function(obj) {
            console.log(obj)
            nomCard.value = obj.card.libelle_carte;
            fullname.value = obj.card.nom_carte;
            cardnumber.value = obj.card.num_carte;
            expiration.value = obj.card.date_expiration;
            cvv.value = obj.card.cvv;
        })
    })
}
    



    

