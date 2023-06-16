document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("mdp");
  const submitButton = document.querySelector('button[name="action"]');
  const submitButtonUser = document.querySelector('button[name="ation"]');

  const lengthSpan = document.getElementById("mdp-length");
  const uppercaseSpan = document.getElementById("mdp-uppercase");
  const lowercaseSpan = document.getElementById("mdp-lowercase");
  const digitSpan = document.getElementById("mdp-digit");
  const specialSpan = document.getElementById("mdp-special");

  passwordInput.addEventListener("input", function () {

    const password = passwordInput.value;
    const lengthRegex = /^.{8,}$/;
    const uppercaseRegex = /^(?=.*[A-Z])/;
    const lowercaseRegex = /^(?=.*[a-z])/;
    const digitRegex = /^(?=.*\d)/;
    const specialRegex = /^(?=.*[@$!%*?&])/;

    if(submitButtonUser && password!==""){
      submitButtonUser.disabled = true
    } else if (submitButtonUser && password==="") {
      submitButtonUser.disabled = false
    }

    lengthSpan.textContent = lengthRegex.test(password)
      ? ""
      : "Le mot de passe doit contenir au moins 8 caractères.";
    uppercaseSpan.textContent = uppercaseRegex.test(password)
      ? ""
      : "Le mot de passe doit contenir au moins une lettre majuscule.";
    lowercaseSpan.textContent = lowercaseRegex.test(password)
      ? ""
      : "Le mot de passe doit contenir au moins une lettre minuscule.";
    digitSpan.textContent = digitRegex.test(password)
      ? ""
      : "Le mot de passe doit contenir au moins un chiffre.";
    specialSpan.textContent = specialRegex.test(password)
      ? ""
      : "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &).";

    lengthSpan.style.display = lengthRegex.test(password) ? "none" : "block";
    uppercaseSpan.style.display = uppercaseRegex.test(password)
      ? "none"
      : "block";
    lowercaseSpan.style.display = lowercaseRegex.test(password)
      ? "none"
      : "block";
    digitSpan.style.display = digitRegex.test(password) ? "none" : "block";
    specialSpan.style.display = specialRegex.test(password) ? "none" : "block";

    const isPasswordValid =
      lengthRegex.test(password) &&
      uppercaseRegex.test(password) &&
      lowercaseRegex.test(password) &&
      digitRegex.test(password) &&
      specialRegex.test(password);

    if (isPasswordValid && isFormComplete()) {
      if (submitButton !== null){
        submitButton.disabled = false;
        submitButton.classList.remove("disabled");
      } else {
        submitButtonUser.disabled = false
        submitButtonUser.classList.remove("disabled");
      }
    } else {
      submitButton.disabled = true;
      submitButton.classList.add("disabled");
    }
  });

  function isFormComplete() {
    const requiredFields = document.querySelectorAll("input[required]");
    let isComplete = true;

    requiredFields.forEach(function (field) {
      if (field.value.trim() === "") {
        isComplete = false;
      }
    });

    return isComplete;
  }
});
