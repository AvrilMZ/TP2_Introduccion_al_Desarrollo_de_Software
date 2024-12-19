let minimo = 0;
let maximo = 20;
let paisesData = [];
let paisesCreados = [];

const cardContainer = document.getElementById("card-container");

function crearCard(pais) {
  const card = document.createElement("div");
  card.className = "card";

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
  paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];

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
  // Combina los datos de restcountries y los países creados
  const unificados = [...paisesData, ...paisesCreados];

  // Filtrar países eliminados
  const paisesEliminados = JSON.parse(localStorage.getItem("paisesEliminados")) || [];
  const paisesUnificados = unificados.filter((pais) => !paisesEliminados.includes(pais.name));

  // Eliminar duplicados
  const nombresUnicos = new Set();
  const paisesSinDuplicados = paisesUnificados.filter((pais) => {
    if (nombresUnicos.has(pais.name)) return false;
    nombresUnicos.add(pais.name);
    return true;
  });

  paisesSinDuplicados.sort((a, b) => a.name.localeCompare(b.name));
  return paisesSinDuplicados;
}

function actualizarPaginacion(paisesFiltrados) {
  const paisesPorPagina = paisesFiltrados.slice(minimo, minimo + maximo);
  cardContainer.innerHTML = "";
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

      const paisesEliminados = JSON.parse(localStorage.getItem("paisesEliminados")) || [];
      paisesData = paisesData.filter((pais) => !paisesEliminados.includes(pais.name));

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

cargarPaisesCreados();
fetchPaises();

// Función para eliminar un país
function eliminarPais(paisId) {
  // Elimina el país de la lista de países creados
  let paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];
  paisesCreados = paisesCreados.filter(pais => pais.id !== paisId);  // Eliminamos el país por ID

  localStorage.setItem("paisesCreados", JSON.stringify(paisesCreados));

  // Actualiza la lista de países eliminados
  let paisesEliminados = JSON.parse(localStorage.getItem("paisesEliminados")) || [];
  paisesEliminados.push(paisId);
  localStorage.setItem("paisesEliminados", JSON.stringify(paisesEliminados));

  window.dispatchEvent(new Event('pais-eliminado'));
}

window.addEventListener('pais-eliminado', () => {
  const paisesUnificados = combinarDatos();
  actualizarPaginacion(paisesUnificados);  // Actualiza las tarjetas
});
