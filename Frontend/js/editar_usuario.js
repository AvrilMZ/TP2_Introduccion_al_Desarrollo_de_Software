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

  const usuarioInput = document.getElementById("usuario");
  const buscarUsuarioButton = document.getElementById("buscar-usuario");
  const saveButton = document.querySelector('button[type="submit"]');

  deshabilitarCambios();

  buscarUsuarioButton.addEventListener("click", function (event) {
    event.preventDefault();
    const usuario = usuarioInput.value;
    fetch(`http://localhost:3000/api/v1/users/${usuario}`)
      .then((response) => response.json())
      .then((user) => {
        if (user) {
          document.querySelector('input[name="nombre"]').value = user.nombre;
          document.getElementById("mail").value = user.mail;
          document.getElementById("pais-select").value = user.nacionalidad;
          document.getElementById("paises-container").value =
            user.paisesVisitados.join(", ");
          document.getElementById("idiomas-container").value =
            user.idiomas.join(", ");
          habilitarCambios();
          document.getElementById("usuario-encontrado").style.display = "block";
        } else {
          document.getElementById("usuario-desconocido").style.display =
            "block";
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const usuario = usuarioInput.value;
    const usuarioActualizado = {
      nombre: document.querySelector('input[name="nombre"]').value,
      mail: document.getElementById("mail").value,
      nacionalidad: document.getElementById("pais-select").value,
      paisesVisitados: Array.from(
        document.getElementById("paises-container").selectedOptions
      ).map((option) => option.value),
      idiomas: Array.from(
        document.getElementById("idiomas-container").selectedOptions
      ).map((option) => option.value),
    };

    if (
      !usuarioActualizado.nombre ||
      !usuarioActualizado.mail ||
      !usuarioActualizado.nacionalidad ||
      usuarioActualizado.paisesVisitados.length === 0 ||
      usuarioActualizado.idiomas.length === 0
    ) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${usuario}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(usuarioActualizado),
        }
      );

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        throw new Error(responseText);
      }

      const data = JSON.parse(responseText);

      alert("Usuario actualizado exitosamente.");

      document.querySelector('input[name="nombre"]').value = data.nombre;
      document.getElementById("mail").value = data.mail;
      document.getElementById("pais-select").value = data.nacionalidad;

      // Limpiar y agregar países visitados
      const paisesContainer = document.getElementById("paises-container");
      Array.from(paisesContainer.options).forEach((option) => {
        option.selected = data.paisesVisitados.includes(option.value);
      });

      // Limpiar y agregar idiomas
      const idiomasContainer = document.getElementById("idiomas-container");
      Array.from(idiomasContainer.options).forEach((option) => {
        option.selected = data.idiomas.includes(option.value);
      });

      console.log("Data:", data);

      window.location.href = "../html/index.html";
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Error al guardar los cambios: " + error.message);
    }
  });

  function habilitarCambios() {
    document.querySelector('input[name="nombre"]').disabled = false;
    document.getElementById("mail").disabled = false;
    document.getElementById("pais-select").disabled = false;
    document.getElementById("paises-container").disabled = false;
    document.getElementById("idiomas-container").disabled = false;
    saveButton.disabled = false;
  }

  function deshabilitarCambios() {
    document.querySelector('input[name="nombre"]').disabled = true;
    document.getElementById("mail").disabled = true;
    document.getElementById("pais-select").disabled = true;
    document.getElementById("paises-container").disabled = true;
    document.getElementById("idiomas-container").disabled = true;
    saveButton.disabled = true;
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
