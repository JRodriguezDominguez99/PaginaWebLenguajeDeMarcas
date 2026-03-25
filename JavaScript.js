const navEnlaces = document.getElementById ('nav-enlaces')

const hamburguesa = document.getElementById ('hamburguesa')
hamburguesa.addEventListener ('click', function() {
navEnlaces.classList.toggle ('abierto')
})