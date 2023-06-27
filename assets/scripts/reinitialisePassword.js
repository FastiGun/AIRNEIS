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
            alert('An email has been send to your email to configure a new password');
        } else {
            throw new Error("Please verify your mail address");
        }
      })
      .catch(function(error) {
        console.error(error);
        alert('Please verify your mail address');
      });
  }