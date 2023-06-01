const selectElements = document.querySelectorAll(".mySelect");

selectElements.forEach((selectElement, index) => {
  selectElement.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    const url = selectedOption.value;
    window.location.href = url;
  });
});
