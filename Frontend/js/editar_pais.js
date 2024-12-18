document.addEventListener("DOMContentLoaded", async () => {
  const paisSelect = document.getElementById("pais-select");
  const saveButton = document.querySelector('button[type="submit"]');

  deshabilitarCambios();

  await cargarPaises();

  paisSelect.addEventListener("change", function (event) {
    const paisNombre = event.target.value;
    const paisesCreados =
      JSON.parse(localStorage.getItem("paisesCreados")) || [];
    const paisEncontrado = paisesCreados.find(
      (pais) => pais.nombre === paisNombre
    );

    if (paisEncontrado) {
      document.querySelector('input[name="nombre"]').value =
        paisEncontrado.nombre;
      document.getElementById("capital").value = paisEncontrado.capital;
      document.getElementById("continente").value = paisEncontrado.continente;
      document.getElementById("moneda").value = paisEncontrado.moneda;
      document.getElementById("idiomas").value =
        paisEncontrado.idiomas.join(", ");
      habilitarCambios();
      document.getElementById("pais-encontrado").style.display = "block";
      document.getElementById("pais-desconocido").style.display = "none";
    } else {
      fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(paisNombre)}`
      )
        .then((response) => response.json())
        .then((countries) => {
          if (countries && countries.length > 0) {
            const country = countries[0];
            document.querySelector('input[name="nombre"]').value =
              country.name.common;
            document.getElementById("capital").value = country.capital
              ? country.capital[0]
              : "";
            document.getElementById("continente").value = country.region;
            document.getElementById("moneda").value = Object.values(
              country.currencies
            )[0].name;
            document.getElementById("idiomas").value = Object.values(
              country.languages
            ).join(", ");
            habilitarCambios();
            document.getElementById("pais-encontrado").style.display = "block";
            document.getElementById("pais-desconocido").style.display = "none";
          } else {
            document.getElementById("pais-encontrado").style.display = "none";
            document.getElementById("pais-desconocido").style.display = "block";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          document.getElementById("pais-encontrado").style.display = "none";
          document.getElementById("pais-desconocido").style.display = "block";
        });
    }
  });

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
      const response = await fetch(
        `http://localhost:3000/api/v1/paises/${encodeURIComponent(paisNombre)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paisActualizado),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar los cambios");
      }

      actualizarPaisEnLocalStorage(paisNombre, paisActualizado);

      alert("País actualizado exitosamente.");

      document.querySelector('input[name="nombre"]').value = data.nombre;
      document.getElementById("capital").value = data.capital;
      document.getElementById("continente").value = data.continente;
      document.getElementById("moneda").value = data.moneda;
      document.getElementById("idiomas").value = data.idiomas.join(", ");

      console.log("Data:", data);

      window.location.href = "../html/index.html";
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

      const paisesCombinados = combinarPaises(countriesAPI, countriesBDD);

      cargarPaisesSelect(paisesCombinados);
    } catch (error) {
      console.error("Error al cargar países:", error);
      mostrarErrorGeneral("No se pudieron cargar los países.");
    }
  }

  function combinarPaises(apiPaises, dbPaises) {
    const nombres = new Set();
    dbPaises.forEach((pais) => nombres.add(pais.nombre));
    apiPaises.forEach((pais) => nombres.add(pais.name.common));
    return Array.from(nombres)
      .sort((a, b) => a.localeCompare(b))
      .map((nombre) => ({ nombre }));
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
    errorGeneral.textContent = mensaje;
    errorGeneral.style.display = "block";
    setTimeout(() => {
      errorGeneral.style.display = "none";
    }, 5000);
  }

  // Función para actualizar el país en el localStorage
  function actualizarPaisEnLocalStorage(paisNombre, paisActualizado) {
    let paisesCreados = JSON.parse(localStorage.getItem("paisesCreados")) || [];

    const index = paisesCreados.findIndex((pais) => pais.nombre === paisNombre);

    if (index !== -1) {
      paisesCreados[index] = {
        nombre: paisActualizado.nombre,
        capital: paisActualizado.capital,
        continente: paisActualizado.continente,
        moneda: paisActualizado.moneda,
        idiomas: paisActualizado.idiomas,
      };
    }
    localStorage.setItem("paisesCreados", JSON.stringify(paisesCreados));
  }
});
