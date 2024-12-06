
let minimo = 0;
let maximo = 20;
let totalPaises = 250; 

const cardContainer = document.getElementById("card-container");

function crearCard(pais) {
    // crea un elemento div con la clase "card"
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML= `
        <img src="${pais.flags.png}" class="card-img-top" alt="${pais.name.common}">
        <div class="content">
            <h5 class="card-title">${pais.name.common}</h5>
            <p>Capital: ${pais.capital || "No disponible"}</p>
            <p>Región: ${pais.region || "No disponible"}</p>
            <p>Población: ${pais.population.toLocaleString()}</p> 
            <p>Superficie: ${pais.area.toLocaleString()} km²</p>
            <p>Idiomas: ${pais.languages ? Object.values(pais.languages).join(", ") : "No disponible"}</p>
        </div>
    `;             //toLocaleString formatea un string para separar los miles con comas
    cardContainer.appendChild(card);
}

function actualizarBotones() { //si estas en primer pagina, o en la ultima, se deshabilitan los botones
    const botonAnterior = document.getElementById("anterior");
    const botonSiguiente = document.getElementById("siguiente");
    botonAnterior.disabled = (minimo === 0); 
    botonSiguiente.disabled = (minimo + maximo >= totalPaises);

}

function fetchPaises(minimo, maximo) {
    fetch("https://restcountries.com/v3.1/all")
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => a.name.common.localeCompare(b.name.common));

            if (minimo >= totalPaises) minimo = totalPaises - maximo;
            if (minimo < 0) minimo = 0;

            const paisesPorPagina = data.slice(minimo, minimo + maximo);

            cardContainer.innerHTML = "";
            paisesPorPagina.forEach(crearCard);
            actualizarBotones()
        })
        .catch(error => console.error("Error al obtener los países:", error)); // Manejo de un posible error
}

function cambiarPagina(direccion) {
    minimo += direccion * maximo; 
    if (minimo < 0) minimo = 0; 
    fetchPaises(minimo, maximo);

}

// Asociar acción a los botones
document.getElementById("anterior").addEventListener("click", () => cambiarPagina(-1));
document.getElementById("siguiente").addEventListener("click", () => cambiarPagina(1));

// Cargar los países inicialmente
fetchPaises(minimo, maximo);
