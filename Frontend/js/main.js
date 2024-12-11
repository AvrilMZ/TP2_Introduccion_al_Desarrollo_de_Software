const textoCarrousel = document.querySelector('.textoCarrousel');
let carrouselIndex = 1;

mostrarFotos(carrouselIndex);

function avanzarFotos(n) {
    mostrarFotos(carrouselIndex += n);
}

function fotosActual(n) {
    mostrarFotos(carrouselIndex = n);
}

function mostrarFotos(n) {
    const fotosCarrousel = document.querySelectorAll('.fotoCarrousel');
    if (n > fotosCarrousel.length) { carrouselIndex = 1; } // Si el índice es mayor que la cantidad, vuelve al primero
    if (n < 1) { carrouselIndex = fotosCarrousel.length; } // Si el índice es menor que 1, va al último

    fotosCarrousel.forEach(foto => foto.style.display = "none");
    fotosCarrousel[carrouselIndex - 1].style.display = "block"; // Muestra la foto actual

    textoCarrousel.style.opacity = 1; // Mostrar el texto con transición
}

setInterval(() => {
    avanzarFotos(1);
}, 10000); // Mueve las fotos cada 10 segundos

// Deslizamiento texto Carrousel
document.addEventListener('DOMContentLoaded', () => {
    const textoCarrousel = document.querySelector('.textoCarrousel');
    const botonPaisesContenedor = document.querySelector('.boton-paises-contenedor');

    // Escuchar cuando la animación del texto termine
    textoCarrousel.addEventListener('animationend', () => {
        // Mostrar el botón después de la animación del texto
        botonPaisesContenedor.classList.remove('hidden');
        botonPaisesContenedor.classList.add('show');
    });
});
