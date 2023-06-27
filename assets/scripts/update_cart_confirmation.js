const selectAddressFactu = document.querySelector("#address-factu");

const nameAddressFactu = document.querySelector("#nomAdresseFactu");
const rueFactu = document.querySelector("#rueFactu");
const villeFactu = document.querySelector("#villeFactu");
const paysFactu = document.querySelector("#paysFactu");
const regionFactu = document.querySelector("#regionFactu");
const complementFactu = document.querySelector("#complementFactu");
const codepostalFactu = document.querySelector("#codepostalFactu");
const checkboxFactu = document.querySelector("#register-addressFactu");


selectAddressFactu.onchange = function () {
    const addressIdFactu = selectAddressFactu.value;
    if (addressIdFactu != "") {
        updateDisplayFactu(addressIdFactu)
        checkboxFactu.setAttribute("disabled", "true")
    } else {
        checkboxFactu.removeAttribute("disabled")
    }
}

function updateDisplayFactu(addressIdFactu) {
    fetch("/getAdresse/" + addressIdFactu).then(function (response) {
        response.json().then(function (obj) {
            nameAddressFactu.value = obj.nom;
            rueFactu.value = obj.rue;
            villeFactu.value = obj.ville;
            paysFactu.value = obj.pays;
            regionFactu.value = obj.region;
            complementFactu.value = obj.complement;
            codepostalFactu.value = obj.cp;
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
const checkboxAddress = document.querySelector("#register-address");

selectAddress.onchange = function () {
    const addressId = selectAddress.value;
    if (addressId != "") {
        updateDisplayAddress(addressId)
        checkboxAddress.setAttribute("disabled", "true")
    } else {
        checkboxAddress.removeAttribute("disabled")
    }
}


function updateDisplayAddress(addressId) {
    fetch("/getAdresse/" + addressId).then(function (response) {
        response.json().then(function (obj) {
            nameAddress.value = obj.nom;
            rue.value = obj.rue;
            ville.value = obj.ville;
            pays.value = obj.pays;
            region.value = obj.region;
            complement.value = obj.complement;
            codepostal.value = obj.cp;
        })
    })
}


const selectPaiements = document.querySelector("#paiements");

const nomCard = document.querySelector("#nomCard");
const fullname = document.querySelector("#fullname");
const cardnumber = document.querySelector("#cardnumber");
const expiration = document.querySelector("#expiration");
const cvv = document.querySelector("#cvv");
const checkboxCard = document.querySelector("#register-card");

selectPaiements.onchange = function () {
    const cardId = selectPaiements.value;
    if (cardId != "") {
        updateDisplayCard(cardId)
        checkboxCard.setAttribute("disabled", "true")
    } else {
        checkboxCard.removeAttribute("disabled")
    }
}


function updateDisplayCard(cardId) {
    fetch("/getPaiement/" + cardId).then(function (response) {
        response.json().then(function (obj) {
            nomCard.value = obj.libelle_carte;
            fullname.value = obj.nom_carte;
            cardnumber.value = obj.num_carte;
            expiration.value = obj.date_expiration;
            cvv.value = obj.cvv;
        })
    })
}






