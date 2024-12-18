document.addEventListener("DOMContentLoaded", async () => {
  const paisSelect = document.getElementById("pais-select");
  const saveButton = document.querySelector('button[type="submit"]');

  deshabilitarCambios();

  await cargarPaises();

  paisSelect.addEventListener("change", function (event) {
    const paisNombre = event.target.value;
    const paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];
    const paisEncontrado = paisesCreados.find((pais) => pais.nombre === paisNombre);
  
    if (paisEncontrado) {
      // Si el país está en localStorage (base de datos local)
      mostrarDatos(paisEncontrado);
    } else {
      // Si el país no está, buscarlo en la API externa
      fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(paisNombre)}`
      )
        .then((response) => response.json())
        .then((countries) => {
          if (countries && countries.length > 0) {
            mostrarDatosAPI(countries[0]);
          } else {
            mostrarErrorGeneral("País no encontrado.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          mostrarErrorGeneral("No se pudo cargar el país.");
        });
    }
  });
  
  function mostrarDatos(pais) {
    document.querySelector('input[name="nombre"]').value = pais.nombre;
    document.getElementById("capital").value = pais.capital;
    document.getElementById("continente").value = pais.continente;
    document.getElementById("moneda").value = pais.moneda;
    document.getElementById("idiomas").value = pais.idiomas.split(", ").join(", ");
    habilitarCambios();
  }
  
  function mostrarDatosAPI(country) {
    document.querySelector('input[name="nombre"]').value = country.name.common;
    document.getElementById("capital").value = country.capital ? country.capital[0] : "";
    document.getElementById("continente").value = country.region;
  
    // Verificar currencies
    document.getElementById("moneda").value = country.currencies
      ? Object.values(country.currencies)[0].name
      : "Sin moneda definida";
  
    // Verificar languages
    document.getElementById("idiomas").value = country.languages
      ? Object.values(country.languages).join(", ")
      : "Sin idiomas definidos";
  
    habilitarCambios(); 
  }
  
  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const paisNombre = paisSelect.value;
    const paisActualizado = {
      nombre: document.querySelector('input[name="nombre"]').value,
      capital: document.getElementById("capital").value,
      continente: document.getElementById("continente").value,
      moneda: document.getElementById("moneda").value,
      idiomas: document.getElementById("idiomas").value.split(", "),
    };
  
    // Validación de campos vacíos
    if (
      !paisActualizado.nombre ||
      !paisActualizado.capital ||
      !paisActualizado.continente ||
      !paisActualizado.moneda ||
      paisActualizado.idiomas.length === 0
    ) {
      alert("Por favor, completa todos los campos.");
      return;
    }
  
    try {
      // Enviar el país actualizado al backend
      const response = await fetch(
        `http://localhost:3000/api/v1/paises/${encodeURIComponent(paisNombre)}`,
        {
          method: "PUT", // Actualiza en lugar de crear
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paisActualizado),
        }
      );
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar los cambios");
      }
  
      // Actualizar localStorage con el nuevo país
      actualizarPaisEnLocalStorage(paisNombre, paisActualizado);
  
      // Actualizar el menú desplegable
      cargarPaisesSelect(JSON.parse(localStorage.getItem("paisesCreados")) || []);
  
      // Mostrar un mensaje de éxito
      alert("País actualizado exitosamente.");
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Error al guardar los cambios: " + error.message);
    }
  });
  
  
  
  

  function habilitarCambios() {
    document.querySelector('input[name="nombre"]').disabled = false;
    document.getElementById("capital").disabled = false;
    document.getElementById("continente").disabled = false;
    document.getElementById("moneda").disabled = false;
    document.getElementById("idiomas").disabled = false;
    saveButton.disabled = false;
  }

  function deshabilitarCambios() {
    document.querySelector('input[name="nombre"]').disabled = true;
    document.getElementById("capital").disabled = true;
    document.getElementById("continente").disabled = true;
    document.getElementById("moneda").disabled = true;
    document.getElementById("idiomas").disabled = true;
    saveButton.disabled = true;
  }

  

  async function cargarPaises() {
    try {
      const [apiResponse, bddResponse] = await Promise.all([
        fetch("https://restcountries.com/v3.1/all"),
        fetch("http://localhost:3000/api/v1/paises"),
      ]);
  
      if (!apiResponse.ok || !bddResponse.ok) {
        throw new Error("Error al cargar países desde una de las fuentes.");
      }
  
      const countriesAPI = await apiResponse.json();
      const countriesBDD = await bddResponse.json();
  
      // Recuperar países existentes en localStorage
      const paisesLocales = JSON.parse(localStorage.getItem("paisesCreados")) || [];
  
      // Combinar países locales con los de la base de datos
      const paisesCombinados = [...new Map([...countriesBDD, ...paisesLocales].map((pais) => [pais.nombre, pais])).values()];
  
      // Guardar en localStorage
      localStorage.setItem("paisesCreados", JSON.stringify(paisesCombinados));
  
      // Combinar con API y actualizar el select
      const paisesFinales = combinarPaises(countriesAPI, paisesCombinados);
      cargarPaisesSelect(paisesFinales);
    } catch (error) {
      console.error("Error al cargar países:", error);
      mostrarErrorGeneral("No se pudieron cargar los países.");
    }
  }
  

  function combinarPaises(apiPaises, dbPaises) {
    const nombres = new Map();
    dbPaises.forEach((pais) => nombres.set(pais.nombre, pais));
    apiPaises.forEach((pais) => {
      if (!nombres.has(pais.name.common)) {
        nombres.set(pais.name.common, { nombre: pais.name.common });
      }
    });
  
    return Array.from(nombres.values())
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  

  function cargarPaisesSelect(paises) {
    const paisSelect = document.getElementById("pais-select");
    paisSelect.innerHTML = "";

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

  function mostrarErrorGeneral(mensaje) {
    const errorGeneral = document.getElementById("error-general");
    if (errorGeneral) {
    errorGeneral.textContent = mensaje;
    errorGeneral.style.display = "block";
    setTimeout(() => {
      errorGeneral.style.display = "none";
    }, 5000);
  } else {
    console.error("No se pudo mostrar el error")
  }
}

function actualizarPaisEnLocalStorage(paisNombre, paisActualizado) {
  let paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];

  // Verificar si el país ya existe
  const index = paisesCreados.findIndex((pais) => pais.nombre === paisNombre);

  if (index !== -1) {
    // Actualizar el país existente
    paisesCreados[index] = paisActualizado;
  } else {
    // Agregar el país si no existe
    paisesCreados.push(paisActualizado);
  }

  localStorage.setItem("paisesCreados", JSON.stringify(paisesCreados));
}
});



