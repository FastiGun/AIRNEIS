document.addEventListener('DOMContentLoaded', function() {
    var menu_icon = document.querySelector(".burger");
    var menu = document.querySelector(".burgermenu");
  
    menu_icon.addEventListener('click', function() {
        menu.classList.toggle('hidden');
        console.log('clicked');
    });
});