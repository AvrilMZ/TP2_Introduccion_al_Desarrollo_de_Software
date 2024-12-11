let minimo = 0;
let maximo = 20;
let paisesData = [];

const cardContainer = document.getElementById('card-container');

function crearCard(pais) {
	// Crea un elemento div con la clase "card"
	const card = document.createElement('div');
	card.className = 'card';

	card.innerHTML = `
        <img src="${pais.flags.png}" class="card-img-top" alt="${pais.name.common}">
        <div class="content">
            <h5 class="card-title">${pais.name.common}</h5>
            <p>Capital: ${pais.capital || 'No disponible'}</p>
            <p>Región: ${pais.region || 'No disponible'}</p>
            <p>Población: ${pais.population.toLocaleString()}</p> 
            <p>Superficie: ${pais.area.toLocaleString()} km²</p>
            <p>Idiomas: ${pais.languages
			? Object.values(pais.languages).join(', ')
			: 'No disponible'
		}</p>
        </div>
    `;
	cardContainer.appendChild(card);
}

// Filtra los países según la búsqueda actual
function actualizarPaginacion(paisesFiltrados) {
	const paisesPorPagina = paisesFiltrados.slice(minimo, minimo + maximo);
	cardContainer.innerHTML = ''; // Limpiar el contenedor de tarjetas
	paisesPorPagina.forEach(crearCard);
	actualizarBotones(paisesFiltrados);
}

// Si estás en la primera página o en la última, se deshabilitan los botones
function actualizarBotones(paisesFiltrados) {
	const botonAnterior = document.getElementById('anterior');
	const botonSiguiente = document.getElementById('siguiente');
	botonAnterior.disabled = minimo === 0;
	botonSiguiente.disabled = minimo + maximo >= paisesFiltrados.length;
}

function fetchPaises() {
	fetch('https://restcountries.com/v3.1/all')
		.then((response) => response.json())
		.then((data) => {
			paisesData = data; // Guarda los datos de todos los países
			paisesData.sort((a, b) => a.name.common.localeCompare(b.name.common));
			actualizarPaginacion(paisesData); // Actualiza la visualización inicial con todos los países
		})
		.catch((error) => console.error('Error al obtener los países:', error));
}

function cambiarPagina(direccion) {
	minimo += direccion * maximo;
	if (minimo < 0) minimo = 0;
	const query = document.getElementById('search').value.toLowerCase();
	const paisesFiltrados = filtrarPaises(query);
	actualizarPaginacion(paisesFiltrados);
}

function buscarPaises() {
	const query = document.getElementById('search').value.toLowerCase();
	const paisesFiltrados = filtrarPaises(query);
	actualizarPaginacion(paisesFiltrados);
}

// Filtra los países por nombre (case-insensitive)
function filtrarPaises(query) {
	return paisesData.filter(pais =>
		pais.name.common.toLowerCase().includes(query)
	);
}

// Asociar acción a los botones de paginación
document.getElementById('anterior').addEventListener('click', () => cambiarPagina(-1));
document.getElementById('siguiente').addEventListener('click', () => cambiarPagina(1));

fetchPaises();
