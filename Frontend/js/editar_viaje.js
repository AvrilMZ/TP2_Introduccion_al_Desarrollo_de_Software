document.addEventListener("DOMContentLoaded", async () => {
  // Función para obtener los parámetros de la URL
  function getParametrosDesdeURL() {
    const pathname = window.location.pathname;
    console.log("Ruta completa:", pathname); // Verifica la URL en la consola

    // Suponiendo que la URL es algo como: /html/editar_viaje.html/usuario/:usuario/viajes/:id
    const segments = pathname.split('/');

    // Asumiendo que el usuario está en la segunda posición y el id en la cuarta
    const usuario = segments[segments.length - 3];  // 'usuario'
    const viajeId = segments[segments.length - 1];  // 'id'

    console.log("Usuario extraído: ", usuario);  // Verifica que el usuario se extraiga correctamente
    console.log("ID del viaje extraído: ", viajeId);

    return { usuario, viajeId };
  }

  const { usuario, viajeId } = getParametrosDesdeURL(); // Extraemos usuario y viajeId de la URL

  if (!usuario || !viajeId) {
    mostrarErrorGeneral("No se pudo obtener el usuario o el ID del viaje.");
    return;
  }

  let ciudadesArray = [];

  await cargarPaises();
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

  // Manejar envío del formulario
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
        const response = await fetch(`/api/v1/users/${usuario}/viajes/${viajeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar el viaje.");
        }

        alert("Viaje actualizado exitosamente.");
        window.location.href = `../html/viajes.html/usuario/${usuario}`;
      } catch (error) {
        mostrarErrorGeneral(error.message || "No se pudo actualizar el viaje.");
      }
    });

  // Capturar ciudades
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

  // Cargar países desde la API y base de datos
  async function cargarPaises() {
    try {
      const [apiResponse, bddResponse] = await Promise.all([
        fetch("https://restcountries.com/v3.1/all"), // Endpoint de restapi
        fetch("http://localhost:3000/api/v1/paises"), // Endpoint de BDD
      ]);

      if (!apiResponse.ok || !bddResponse.ok) {
        throw new Error("Error al cargar países desde una de las fuentes.");
      }

      const countriesAPI = await apiResponse.json();
      const countriesBDD = await bddResponse.json();

      // Combinar y estandarizar los países
      const paisesCombinados = combinarPaises(countriesAPI, countriesBDD);

      cargarPaisesSelect(paisesCombinados);
    } catch (error) {
      console.error("Error al cargar países:", error);
      mostrarErrorGeneral("No se pudieron cargar los países.");
    }
  }

  // Combinar países de la API externa y la base de datos
  function combinarPaises(apiPaises, dbPaises) {
    const nombresAPI = apiPaises.map((pais) => ({
      nombre: pais.name.common,
    }));

    const nombresBDD = dbPaises.map((pais) => ({
      nombre: pais.nombre,
    }));

    // Combinar y eliminar duplicados basados en el nombre
    const paisesUnicos = [...nombresBDD];
    nombresAPI.forEach((apiPais) => {
      if (!paisesUnicos.some((p) => p.nombre === apiPais.nombre)) {
        paisesUnicos.push(apiPais);
      }
    });

    paisesUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return paisesUnicos;
  }

  // Cargar los países en el selector
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

  // Cargar datos del viaje
  function cargarDatosViaje(viaje) {
    document.getElementById("pais-select").value = viaje.pais.nombre;
    document.getElementById("fecha-inicio").value = viaje.fechaInicio.split("T")[0];
    document.getElementById("fecha-fin").value = viaje.fechaFin.split("T")[0];
    document.getElementById("presupuesto").value = viaje.presupuesto;
    document.getElementById("calificacion").value = viaje.calificacion;

    ciudadesArray = viaje.ciudades || [];
    actualizarCiudadesTags();
  }

  // Actualizar etiquetas de ciudades
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
