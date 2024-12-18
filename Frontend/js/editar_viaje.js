document.addEventListener("DOMContentLoaded", async () => {
  // Función para obtener el ID del viaje desde la URL
  function getViajeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    console.log("Id del viaje desde la url: ", id);
    return id;
  }

  const viajeId = getViajeIdFromURL(); // Obtener el ID del viaje desde la URL
  let ciudadesArray = []; // Array para almacenar las ciudades del viaje

  // Llamar a la función para cargar países
  await cargarPaises();

  // Cargar datos del viaje si hay un ID válido
  if (viajeId) {
    fetch(`http://localhost:3000/api/v1/viajes/${viajeId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los datos del viaje.");
        }
        return response.json();
      })
      .then((viaje) => {
        cargarDatosViaje(viaje);
      })
      .catch((error) => {
        mostrarErrorGeneral(
          "No se pudieron cargar los datos del viaje. Intenta nuevamente."
        );
      });
  } else {
    mostrarErrorGeneral("No se encontró un ID válido para este viaje.");
  }

  // Manejar el evento de envío del formulario
  document
    .getElementById("form-viaje")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const data = {
        pais: document.getElementById("pais-select").value,
        ciudades: ciudadesArray,
        fechaInicio: document.getElementById("fecha-inicio").value,
        fechaFin: document.getElementById("fecha-fin").value,
        presupuesto: parseFloat(document.getElementById("presupuesto").value),
        calificacion: parseInt(document.getElementById("calificacion").value),
      };

      if (
        !data.pais ||
        !data.fechaInicio ||
        !data.fechaFin ||
        !data.ciudades.length ||
        !data.presupuesto ||
        data.calificacion === undefined
      ) {
        mostrarErrorGeneral(
          "Por favor, completa todos los campos obligatorios."
        );
        return;
      }

      if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
        mostrarErrorGeneral(
          "La fecha de inicio no puede ser posterior a la fecha de fin."
        );
        return;
      }

      try {
        const response = await fetch(`/api/v1/viajes/${viajeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar el viaje.");
        }

        alert("Viaje actualizado exitosamente.");
        window.location.href = "../html/viajes.html";
      } catch (error) {
        mostrarErrorGeneral(error.message || "No se pudo actualizar el viaje.");
      }
    });

  // Evento para capturar ciudades
  const inputCiudades = document.getElementById("ciudades");
  inputCiudades.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const ciudad = inputCiudades.value.trim();
      if (ciudad && !ciudadesArray.includes(ciudad)) {
        ciudadesArray.push(ciudad);
        actualizarCiudadesTags();
        inputCiudades.value = "";
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
});
