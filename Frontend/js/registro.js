document.addEventListener("DOMContentLoaded", async () => {
  fetch("https://restcountries.com/v3.1/all")
    .then((response) => response.json())
    .then((countries) => {
      cargarPaisesSelect(countries);
      cargarPaisesMultiSelect(countries);
      cargarIdiomas(countries);
    });

  // Países para la nacionalidad
  await cargarPaises();

  // Países para países visitados
  function cargarPaisesMultiSelect(countries) {
    const paisesContainer = document.getElementById("paises-container");
    countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.name.common;
      option.textContent = country.name.common;
      paisesContainer.appendChild(option);
    });

    console.log(
      "Opciones cargadas para países visitados:",
      paisesContainer.innerHTML
    );
    // Inicializar MultiSelect
    setTimeout(() => new MultiSelectTag("paises-container"), 0);
  }

  // Idiomas
  function cargarIdiomas(countries) {
    const idiomasContainer = document.getElementById("idiomas-container");
    const idiomas = new Set();
    countries.forEach((country) => {
      if (country.languages) {
        Object.values(country.languages).forEach((language) =>
          idiomas.add(language)
        );
      }
    });

    Array.from(idiomas)
      .sort()
      .forEach((language) => {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = language;
        idiomasContainer.appendChild(option);
      });

    setTimeout(() => new MultiSelectTag("idiomas-container"), 0);
  }
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
      nombre: formData.get("nombre"),
      usuario: formData.get("usuario"),
      mail: formData.get("mail"),
      nacionalidad: formData.get("nacionalidad"),
      paisesVisitados: formData.getAll("paisesVisitados[]"),
      idiomas: formData.getAll("idiomas[]"),
    };

    //VALIDACIONES
    const errores = {};

    if (data.usuario.length < 5) {
      errores.usuario = "El usuario debe tener al menos 5 caracteres";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.mail)) {
      errores.mail = "El email no es válido";
    }

    if (data["paisesVisitados"].length === 0) {
      errores["paisesVisitados"] = "Selecciona al menos un país";
    }

    if (data.idiomas.length === 0) {
      errores.idiomas = "Selecciona al menos un idioma";
    }

    //si hay errores en el {errores}, muestro su contenedor
    if (Object.keys(errores).length > 0) {
      const erroresArray = Object.entries(errores).map(([campo, mensaje]) => ({
        campo,
        msg: mensaje,
      }));
      mostrarErrores(erroresArray);
      return;
    }

    //envio los datos al backend
    try {
      const response = await fetch("http://localhost:3000/api/v1/users", {
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
      const usuarioCreado = await response.json();
      console.log("Usuario creado:", usuarioCreado);
      alert("Usuario creado exitosamente");
      event.target.reset();
    } catch (error) {
      console.error("Error recibido del backend:", error);

      //si backend devuelve error especifico lo muestro
      if (Array.isArray(error.error)) {
        mostrarErrores(error.error.map((msg) => ({ msg })));
      } else {
        //sino msj generico (estos errores podriamos dejarlos solamente genericos arriba del form)
        const errorGeneral = document.getElementById("error-general");
        errorGeneral.textContent =
          "Ocurrió un error inesperado. Intenta nuevamente.";
        errorGeneral.style.display = "block";
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
