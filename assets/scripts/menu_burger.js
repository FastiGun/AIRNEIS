var menu_icon = document.querySelector(".burger");
var menu = document.querySelector(".burgermenu");

function handleMenuBurger() {
    menu.classList.toggle('hidden')
}

menu.addEventListener("click", handleMenuBurger)