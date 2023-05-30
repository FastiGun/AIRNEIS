var menu_icon = document.querySelector(".burger");
var menu = document.querySelector(".burgermenu");

function handleMenuBurger(e) {
    menu.classList.toggle('hidden');
}

menu.addEventListener("click", handleMenuBurger);