let ciudadesArray = [];

document.addEventListener("DOMContentLoaded", async () => {
  fetch("https://restcountries.com/v3.1/all");

  // Países para la nacionalidad
  await cargarPaises();

  const inputCiudades = document.getElementById("ciudades");
  const tagsContainer = document.getElementById("ciudades-tags");

  // Array para almacenar las ciudades
  inputCiudades.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // esto hace q no se envie el form con un enter

      const ciudad = inputCiudades.value.trim().toUpperCase();
      if (ciudad && !ciudadesArray.includes(ciudad)) {
        ciudadesArray.push(ciudad);

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = ciudad;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = "&times;";
        tag.appendChild(deleteButton);

        tagsContainer.appendChild(tag);

        deleteButton.addEventListener("click", function () {
          ciudadesArray = ciudadesArray.filter((c) => c !== ciudad);
          tagsContainer.removeChild(tag);
        });
      }

      inputCiudades.value = "";
    }
  });
});

document
  .querySelector("form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    function mostrarErrores(errores) {
      const errorDiv = document.getElementById("error-mensajes");

      errorDiv.innerHTML = "";
      errores.forEach((error) => {
        const mensaje = document.createElement("p"); //crea un p para cada error
        mensaje.textContent = error.msg || error;
        errorDiv.appendChild(mensaje);
      });
      errorDiv.style.display = "block"; // muestra el container de errores
    }

    const formData = new FormData(event.target);
    //guardo los valores de los inputs
    const data = {
      usuario: formData.get("usuario"),
      pais: formData.get("pais"),
      fechaInicio: formData.get("viaje-inicio"),
      fechaFin: formData.get("viaje-fin"),
      ciudades: ciudadesArray,
      presupuesto: formData.get("presupuesto"),
      calificacion: formData.get("calificacion"),
    };

    console.log("Datos enviados al backend:", data);

    //VALIDACIONES
    if (
      !data.usuario ||
      !data.pais ||
      !data.fechaFin ||
      !data.fechaInicio ||
      !data.presupuesto ||
      !data.calificacion
    ) {
      alert("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (new Date(data["fechaInicio"]) > new Date(data["fechaFin"])) {
      alert(
        "La fecha de inicio del viaje no puede ser posterior a la fecha de fin."
      );
      return;
    }

    //envio los datos al backend
    try {
      const response = await fetch("http://localhost:3000/api/v1/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      //si la rta falla, devuelvo el error para el catch
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      //se crea, muestro una alerta y reinicio la pagina
      const viajeCreado = await response.json();
      console.log("Viaje creado:", viajeCreado);
      alert("Viaje agregado exitosamente");
      event.target.reset();
    } catch (error) {
      console.error("Error recibido del backend:", error);

      //si backend devuelve error especifico lo muestro
      if (Array.isArray(error.error)) {
        mostrarErrores(error.error);
      } else {
        mostrarErrores(["Ocurrió un error inesperado. Intenta nuevamente."]);
      }
    }
  });

// Función para cargar países desde la API y base de datos
async function cargarPaises() {
  try {
    // Realizar fetch a ambas fuentes
    const [apiResponse, bddResponse] = await Promise.all([
      fetch("https://restcountries.com/v3.1/all"), //endpoint de restapi
      fetch("http://localhost:3000/api/v1/paises"), //endpoint de bdd
    ]);

    if (!apiResponse.ok || !bddResponse.ok) {
      throw new Error("Error al cargar países desde una de las fuentes.");
    }

    const countriesAPI = await apiResponse.json();
    const countriesBDD = await bddResponse.json();

    // Combinar y estandarizar los países
    const paisesCombinados = combinarPaises(countriesAPI, countriesBDD);

    // Cargar países en el selector
    cargarPaisesSelect(paisesCombinados);
  } catch (error) {
    console.error("Error al cargar países:", error);
    mostrarErrorGeneral("No se pudieron cargar los países.");
  }
}

// Función para combinar países de la API externa y la base de datos
function combinarPaises(apiPaises, dbPaises) {
  // Extraigo nombres de la API
  const nombresAPI = apiPaises.map((pais) => ({
    nombre: pais.name.common,
  }));

  // Extraigo nombres de la base de datos
  const nombresBDD = dbPaises.map((pais) => ({
    nombre: pais.nombre,
  }));

  // Combinar y eliminar duplicados basados en el nombre
  const paisesUnicos = [...nombresBDD]; // Copio los países de la base de datos
  nombresAPI.forEach((apiPais) => {
    if (!paisesUnicos.some((p) => p.nombre === apiPais.nombre)) {
      // Si no existe en la base de datos lo agrego
      paisesUnicos.push(apiPais);
    }
  });

  paisesUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return paisesUnicos;
}

// Función para cargar los países en el selector
// Función para cargar los países en el selector
function cargarPaisesSelect(paises) {
  const paisSelect = document.getElementById("pais-select");
  paisSelect.innerHTML = "";

  // Agregar opción por defecto
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Seleccionar";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  paisSelect.appendChild(defaultOption);

  paises.forEach((pais) => {
    const option = document.createElement("option");
    option.value = pais.nombre;
    option.textContent = pais.nombre;

    paisSelect.appendChild(option);
  });
}

// Función para cargar datos del viaje
function cargarDatosViaje(viaje) {
  document.getElementById("pais-select").value = viaje.pais.nombre;
  document.getElementById("fecha-inicio").value =
    viaje.fechaInicio.split("T")[0];
  document.getElementById("fecha-fin").value = viaje.fechaFin.split("T")[0];
  document.getElementById("presupuesto").value = viaje.presupuesto;
  document.getElementById("calificacion").value = viaje.calificacion;

  ciudadesArray = viaje.ciudades || [];
  actualizarCiudadesTags();
}

// Función para actualizar etiquetas de ciudades
function actualizarCiudadesTags() {
  const tagsContainer = document.getElementById("ciudades-tags");
  tagsContainer.innerHTML = "";
  ciudadesArray.forEach((ciudad) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = ciudad;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = "&times;";

    deleteButton.addEventListener("click", () => {
      ciudadesArray = ciudadesArray.filter((c) => c !== ciudad);
      actualizarCiudadesTags();
    });

    tag.appendChild(deleteButton);
    tagsContainer.appendChild(tag);
  });
}

// Mostrar mensajes de error
function mostrarErrorGeneral(mensaje) {
  const errorGeneral = document.getElementById("error-general");
  errorGeneral.textContent = mensaje;
  errorGeneral.classList.remove("is-hidden");
  setTimeout(() => {
    errorGeneral.classList.add("is-hidden");
  }, 5000);
}
