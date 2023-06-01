const selectElement = document.querySelector(".mySelect");

selectElement.addEventListener("change", function () {
  const selectedOption = this.options[this.selectedIndex];
  const url = selectedOption.value;

  // Rediriger vers l'URL sélectionnée
  window.location.href = url;
});
