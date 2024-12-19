const API_URL = "http://localhost:3000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  const viajeIdInput = document.getElementById("viaje-id");
  const buscarViajeButton = document.getElementById("buscar-viaje");
  const saveButton = document.querySelector('button[type="submit"]');
  let ciudadesArray = [];

  deshabilitarCamposEdicion();

  buscarViajeButton.addEventListener("click", async function (event) {
    event.preventDefault();
    const viajeId = viajeIdInput.value.trim();

    if (!viajeId) {
      mostrarErrorGeneral("Por favor, ingresa un ID de viaje.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/viajes/${viajeId}`
      );
      if (!response.ok) {
        throw new Error("No se pudo encontrar el viaje.");
      }

      const viaje = await response.json();
      cargarDatosViaje(viaje);
      habilitarCamposEdicion();
    } catch (error) {
      mostrarErrorGeneral(error.message || "No se pudo encontrar el viaje.");
    }
  });

  // Manejar envío del formulario
  document.getElementById("form-viaje").addEventListener("submit", async function (event) {
    event.preventDefault();

    const viajeId = viajeIdInput.value.trim(); // ID del viaje
    const data = {
      pais: document.getElementById("pais-select").value.trim(),
      ciudades: ciudadesArray,
      fechaInicio: document.getElementById("fecha-inicio").value.trim(),
      fechaFin: document.getElementById("fecha-fin").value.trim(),
      presupuesto: parseFloat(document.getElementById("presupuesto").value.trim()),
      calificacion: parseInt(document.getElementById("calificacion").value.trim()),
    };

    console.log("Datos enviados al servidor:", data);

    // Validaciones básicas antes de enviar
    if (
      !data.pais ||
      !data.fechaInicio ||
      !data.fechaFin ||
      data.ciudades.length === 0 ||
      isNaN(data.presupuesto) ||
      isNaN(data.calificacion)
    ) {
      mostrarErrorGeneral("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
      mostrarErrorGeneral("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/viajes/${viajeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo actualizar el viaje.");
      }

      const viajeActualizado = await response.json();
      console.log("Viaje actualizado:", viajeActualizado);

      alert("Viaje actualizado exitosamente.");
      window.location.href = "../html/viajes.html";
    } catch (error) {
      console.error("Error al actualizar el viaje:", error);
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

    const fechaInicio = viaje.fechaInicio ? viaje.fechaInicio.split("T")[0] : "1950-01-01";
    const fechaFin = viaje.fechaFin ? viaje.fechaFin.split("T")[0] : "1950-01-02";

    document.getElementById("fecha-inicio").value = fechaInicio;
    document.getElementById("fecha-fin").value = fechaFin;

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

  function habilitarCamposEdicion() {
    document.getElementById("pais-select").disabled = false;
    document.getElementById("fecha-inicio").disabled = false;
    document.getElementById("fecha-fin").disabled = false;
    document.getElementById("presupuesto").disabled = false;
    document.getElementById("calificacion").disabled = false;
    document.getElementById("ciudades").disabled = false;
    saveButton.disabled = false;
  }

  function deshabilitarCamposEdicion() {
    document.getElementById("pais-select").disabled = true;
    document.getElementById("fecha-inicio").disabled = true;
    document.getElementById("fecha-fin").disabled = true;
    document.getElementById("presupuesto").disabled = true;
    document.getElementById("calificacion").disabled = true;
    document.getElementById("ciudades").disabled = true;
    saveButton.disabled = true;
  }

  await cargarPaises();
});
