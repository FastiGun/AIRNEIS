// Récupérez le sélecteur de statut
const statutOrderSelect = document.querySelector("#statutOrder");

// Ajoutez un écouteur d'événement "change"
statutOrderSelect.addEventListener("change", (event) => {
  const newStatut = event.target.value; // Obtenez la nouvelle valeur sélectionnée
  const idCommande = event.target.selectedOptions[0].dataset.commande; // Obtenez l'ID de la commande correspondante

  // Effectuez une requête AJAX pour mettre à jour le statut de la commande
  fetch(`/backoffice/orders/${idCommande}/statut`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ statut: newStatut }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Statut mis à jour avec succès :", data);
      // Effectuez d'autres actions ou rafraîchissez la page si nécessaire
    })
    .catch((error) => {
      console.error("Erreur lors de la mise à jour du statut :", error);
      // Gérez les erreurs de manière appropriée
    });
});
