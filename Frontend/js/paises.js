let minimo = 0;
let maximo = 20;
let paisesData = [];
let paisesCreados = [];

const cardContainer = document.getElementById("card-container");

function crearCard(pais) {
  // Crea un elemento div con la clase "card"
  const card = document.createElement("div");
  card.className = "card";

  // Asignar bandera o imagen predeterminada
  const bandera =
    pais.flags?.png || pais.flags?.jpg || "../img/img_no_disponible.jpg";

  card.innerHTML = `
        <img src="${bandera}" class="card-img-top" alt="${pais.name}">
        <div class="content">
            <h5 class="card-title">${pais.name}</h5>
            <p>Capital: ${pais.capital || "No disponible"}</p>
            <p>Región: ${pais.region || "No disponible"}</p>
            <p>Población: ${pais.population
      ? pais.population.toLocaleString()
      : "No disponible"
    }</p> 
			<p>Superficie: ${pais.area ? pais.area.toLocaleString() : "No disponible"
    } km²</p>
            <p>Idiomas: ${pais.languages || "No disponible"}</p>
        </div>
    `;
  cardContainer.appendChild(card);
}

function cargarPaisesCreados() {
  // Obtiene los países creados desde localStorage
  paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];

  // Normaliza los datos de los países creados
  paisesCreados = paisesCreados.map((pais) => ({
    name: pais.nombre || "Sin nombre",
    capital: pais.capital || "No disponible",
    region: pais.continente || "No disponible",
    population: pais.poblacion || null,
    area: pais.superficie || null,
    flags: pais.flags || { jpg: "../img/img_no_disponible.jpg" },
    languages: Array.isArray(pais.idiomas)
      ? pais.idiomas.join(", ")
      : "No disponible",
  }));
}

function combinarDatos() {
  // Combinar los datos de restcountries y los países creados
  const unificados = [...paisesData, ...paisesCreados];

  // Eliminar duplicados basados en el nombre del país
  const nombresUnicos = new Set();
  const paisesUnificados = unificados.filter((pais) => {
    if (nombresUnicos.has(pais.name)) return false;
    nombresUnicos.add(pais.name);
    return true;
  });

  // Ordenar alfabéticamente por nombre
  paisesUnificados.sort((a, b) => a.name.localeCompare(b.name));

  return paisesUnificados;
}

function actualizarPaginacion(paisesFiltrados) {
  const paisesPorPagina = paisesFiltrados.slice(minimo, minimo + maximo);
  cardContainer.innerHTML = ""; // Limpiar el contenedor de tarjetas
  paisesPorPagina.forEach(crearCard);
  actualizarBotones(paisesFiltrados);
}

function actualizarBotones(paisesFiltrados) {
  const botonAnterior = document.getElementById("anterior");
  const botonSiguiente = document.getElementById("siguiente");
  botonAnterior.disabled = minimo === 0;
  botonSiguiente.disabled = minimo + maximo >= paisesFiltrados.length;
}

function fetchPaises() {
  cargarPaisesCreados();
  fetch("https://restcountries.com/v3.1/all")
    .then((response) => response.json())
    .then((data) => {
      // Normaliza los datos de la API
      paisesData = data.map((pais) => ({
        name: pais.name.common,
        capital: pais.capital?.[0] || "No disponible",
        region: pais.region || "No disponible",
        population: pais.population || null,
        area: pais.area || null,
        flags: pais.flags || { png: "../img/img_no_disponible.jpg" },
        languages: pais.languages
          ? Object.values(pais.languages).join(", ")
          : "No disponible",
      }));

      // Combina datos y actualiza la visualización inicial
      const paisesUnificados = combinarDatos();
      actualizarPaginacion(paisesUnificados);
    })
    .catch((error) => console.error("Error al obtener los países:", error));
}

function cambiarPagina(direccion) {
  minimo += direccion * maximo;
  if (minimo < 0) minimo = 0;
  const query = document.getElementById("search").value.toLowerCase();
  const paisesFiltrados = filtrarPaises(query);
  actualizarPaginacion(paisesFiltrados);
}

function buscarPaises() {
  const query = document.getElementById("search").value.toLowerCase();
  const paisesFiltrados = filtrarPaises(query);
  actualizarPaginacion(paisesFiltrados);
}

function filtrarPaises(query) {
  const paisesUnificados = combinarDatos();
  return paisesUnificados.filter((pais) =>
    pais.name.toLowerCase().includes(query)
  );
}

// Asociar acciones a los botones
document
  .getElementById("anterior")
  .addEventListener("click", () => cambiarPagina(-1));
document
  .getElementById("siguiente")
  .addEventListener("click", () => cambiarPagina(1));

// Llamar las funciones después de cargar los países
cargarPaisesCreados();
fetchPaises();
