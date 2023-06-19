function forgotPassword() {
    var email = document.getElementById('mail').value;

    fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
      .then(function(response) {
        if (response.ok) {
          alert('Un email de réinitialisation a été envoyé à votre adresse email.');
        } else {
          throw new Error("Une erreur s'est produite lors de l'envoi de la demande de réinitialisation de mot de passe.");
        }
      })
      .catch(function(error) {
        console.error(error);
        alert('Une erreur s\'est produite lors de l\'envoi de la demande de réinitialisation de mot de passe. Veuillez réessayer ultérieurement.');
      });
  }