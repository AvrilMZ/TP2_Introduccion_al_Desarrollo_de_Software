const cardContainer = document.getElementById("card-container");

// Función para obtener la bandera de un país desde la API
async function obtenerBandera(nombrePais) {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(nombrePais)}`
    );
    const data = await response.json();
    return data[0]?.flags?.png || "../img/img_no_disponible.jpg";
  } catch (error) {
    console.error("Error al obtener la bandera:", error);
    return "../img/img_no_disponible.jpg";
  }
}

// Función para agregar banderas a los viajes si no están presentes
async function agregarBanderas(viajes) {
  for (const viaje of viajes) {
    if (viaje.pais && !viaje.pais.flags) {
      viaje.pais.flags = {
        png: await obtenerBandera(viaje.pais.nombre),
      };
    }
  }
  return viajes;
}

// Mostrar viajes pertenecientes al usuario
async function mostrarViajes(viajes, paisesVisitados) {
  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = "";

  const viajesConBanderas = await agregarBanderas(viajes);

  const paisesNoAsociados = paisesVisitados.filter(
    (pais) => !viajesConBanderas.some((viaje) => viaje.pais?.nombre === pais)
  );

  viajesConBanderas.forEach((viaje) => {
    const pais = viaje.pais;
    const flagUrl = pais?.flags?.png || "../img/img_no_disponible.jpg";

    const card = document.createElement("div");
    card.className = "card is-horizontal";

    card.innerHTML = `
            <div class="card-image">
                <figure class="image">
                    <img src="${flagUrl}" alt="${
      pais ? pais.nombre : "País desconocido"
    }">
                </figure>
            </div>
            <div class="card-content">
                <div class="media">
                    <div class="media-left">
                        <figure class="image is-48x48">
                            <img src="${flagUrl}" alt="${
      pais ? pais.nombre : "País desconocido"
    }">
                        </figure>
                    </div>
                    <div class="media-content">
                        <p class="title is-4">${
                          pais ? pais.nombre : "País desconocido"
                        }</p>
                    </div>
                </div>
                <div class="info">
                    <p>Fecha de inicio: ${new Date(
                      viaje.fechaInicio
                    ).toLocaleDateString()}</p>
                    <p>Fecha de fin: ${new Date(
                      viaje.fechaFin
                    ).toLocaleDateString()}</p>
                    <p>Ciudades visitadas: ${viaje.ciudades.join(", ")}</p>
                    <p>Presupuesto: $${viaje.presupuesto.toLocaleString()}</p>
                    <p>Calificación: ${viaje.calificacion}</p>
                </div>
                <footer class="card-footer">
                    <a href="editar_viaje.html?id=${
                      viaje.id
                    }" class="card-footer-item">Modificar</a>
                    <a href="#" class="card-footer-item delete-viaje" data-id="${
                      viaje.id
                    }">Eliminar</a>
                </footer>
            </div>
        `;
    cardContainer.appendChild(card);
  });

  for (const pais of paisesNoAsociados) {
    const flagUrl = await obtenerBandera(pais);

    const card = document.createElement("div");
    card.className = "card is-horizontal";

    card.innerHTML = `
            <div class="card-image">
                <figure class="image">
                    <img src="${flagUrl}" alt="${pais}">
                </figure>
            </div>
            <div class="card-content">
                <div class="media">
                    <div class="media-left">
                        <figure class="image is-48x48">
                            <img src="${flagUrl}" alt="${pais}">
                        </figure>
                    </div>
                    <div class="media-content">
                        <p class="title is-4">${pais}</p>
                    </div>
                </div>
                <div class="info">
                    <p>Fecha de inicio: -</p>
                    <p>Fecha de fin: -</p>
                    <p>Ciudades visitadas: -</p>
                    <p>Presupuesto: -</p>
                    <p>Calificación: -</p>
                </div>
                <footer class="card-footer">
                    <a href="#" class="card-footer-item modificar-viaje">Modificar</a>
                    <a href="#" class="card-footer-item delete-viaje">Eliminar</a>
                </footer>
            </div>
        `;
    cardContainer.appendChild(card);
  }
}

function agregarEventosModificar() {
  const botonesModificar = document.querySelectorAll(".modificar-viaje");

  botonesModificar.forEach((boton) => {
    // Obtener el ID del viaje y el nombre del usuario
    const viajeId = boton.getAttribute("data-id");
    const usuario = boton.getAttribute("data-usuario");

    // Verificar que los datos existan
    if (viajeId && usuario) {
      // Crear el enlace de edición y agregarlo al DOM
      const link = document.createElement("a");
      link.href = `editar_viaje.html?id=${viajeId}`;
      link.textContent = "Editar viaje";
      link.classList.add("button", "is-link", "is-light");
      boton.parentElement.appendChild(link);
    } else {
      console.error("Faltan datos para la redirección");
    }

    boton.addEventListener("click", (event) => {
      event.preventDefault();
      // Redirigir a la página de edición con los parámetros en la URL
      window.location.href = `editar_viaje.html?id=${viajeId}`;
    });
  });
}

// Verificar existencia de usuario y obtener viajes
document.getElementById("buscar-viaje").addEventListener("click", async () => {
  const usuarioInput = document.getElementById("usuario");
  const usuario = usuarioInput.value.trim();
  const usuarioEncontrado = document.getElementById("usuario-encontrado");
  const usuarioDesconocido = document.getElementById("usuario-desconocido");
  const cardContainer = document.getElementById("card-container");

  usuarioEncontrado.style.display = "none";
  usuarioDesconocido.style.display = "none";
  cardContainer.style.display = "none";
  usuarioInput.classList.remove("is-success", "is-danger");

  if (usuario) {
    try {
      // Obtiene los viajes y países visitados del usuario
      const viajesResponse = await fetch(
        `http://localhost:3000/api/v1/users/${usuario}/viajes`
      );
      const userResponse = await fetch(
        `http://localhost:3000/api/v1/users/${usuario}`
      );

      if (viajesResponse.ok && userResponse.ok) {
        const viajesData = await viajesResponse.json();
        const userData = await userResponse.json();

        usuarioEncontrado.style.display = "block";
        usuarioInput.classList.add("is-success");
        cardContainer.style.display = "block";

        // Muestra los viajes y países visitados
        mostrarViajes(viajesData, userData.paisesVisitados);
      } else {
        usuarioDesconocido.style.display = "block";
        usuarioInput.classList.add("is-danger");
      }
    } catch (error) {
      usuarioDesconocido.style.display = "block";
      usuarioInput.classList.add("is-danger");
      console.error("Error:", error);
    }
  } else {
    alert("Por favor, ingrese un usuario.");
  }
});

// Evento para manejar la eliminación de un viaje
document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-viaje")) {
    event.preventDefault();

    // Obtener el ID del viaje y el país desde el atributo `data-id` o `data-pais`
    const viajeId = event.target.dataset.id;
    const pais = event.target.dataset.pais;

    if (viajeId) {
      const confirmar = confirm(
        "¿Estás seguro de que quieres eliminar este viaje?"
      );
      if (confirmar) {
        try {
          // Realiza una petición DELETE al servidor para eliminar el viaje
          const response = await fetch(
            `http://localhost:3000/api/v1/viajes/${viajeId}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            // Eliminar la tarjeta del DOM
            const card = event.target.closest(".card");
            card.remove();
            alert("El viaje ha sido eliminado con éxito.");

            // Actualizar el campo `paisesVisitados` del usuario para eliminar el país
            if (pais) {
              const usuarioInput = document.getElementById("usuario");
              const usuario = usuarioInput.value.trim();

              // Obtener los datos del usuario
              const userResponse = await fetch(
                `http://localhost:3000/api/v1/users/${usuario}`
              );

              if (userResponse.ok) {
                const userData = await userResponse.json();

                // Elimina el país de la lista de países visitados del usuario
                const updateResponse = await fetch(
                  `http://localhost:3000/api/v1/users/${usuario}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      paisesVisitados: [
                        ...new Set(
                          // Elimina el país del array de países visitados
                          userData.paisesVisitados.filter((p) => p !== pais)
                        ),
                      ],
                    }),
                  }
                );

                if (updateResponse.ok) {
                  console.log("País eliminado de países visitados del usuario");
                } else {
                  alert("No se pudo actualizar el país visitado.");
                }
              } else {
                alert("No se pudo obtener los datos del usuario.");
              }
            }
          } else {
            alert("No se pudo eliminar el viaje. Intente nuevamente.");
          }
        } catch (error) {
          console.error("Error al eliminar el viaje:", error);
          alert("Hubo un error al eliminar el viaje.");
        }
      }
    }
  }
});
