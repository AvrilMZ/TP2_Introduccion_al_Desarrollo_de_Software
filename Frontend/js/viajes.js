const cardContainer = document.getElementById('card-container');

// Función para obtener la bandera de un país desde la API
async function obtenerBandera(nombrePais) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(nombrePais)}`);
        const data = await response.json();
        return data[0]?.flags?.png || 'https://via.placeholder.com/150'; // Imagen por defecto si no hay bandera
    } catch (error) {
        console.error('Error al obtener la bandera:', error);
        return 'https://via.placeholder.com/150'; // Imagen por defecto si hay un error
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
    const cardContainer = document.getElementById('card-container');
    cardContainer.innerHTML = '';

    // Asegura que los viajes tengan banderas
    const viajesConBanderas = await agregarBanderas(viajes);

    // Extrae los países que no tienen un viaje asociado
    const paisesNoAsociados = paisesVisitados.filter(pais =>
        !viajesConBanderas.some(viaje => viaje.pais?.nombre === pais)
    );

    // Muestra cada viaje existente
    viajesConBanderas.forEach(viaje => {
        const pais = viaje.pais;
        const flagUrl = pais?.flags?.png || 'https://via.placeholder.com/150';

        const card = document.createElement('div');
        card.className = 'card is-horizontal';

        card.innerHTML = `
            <div class="card-image">
                <figure class="image">
                    <img src="${flagUrl}" alt="${pais ? pais.nombre : 'País desconocido'}">
                </figure>
            </div>
            <div class="card-content">
                <div class="media">
                    <div class="media-left">
                        <figure class="image is-48x48">
                            <img src="${flagUrl}" alt="${pais ? pais.nombre : 'País desconocido'}">
                        </figure>
                    </div>
                    <div class="media-content">
                        <p class="title is-4">${pais ? pais.nombre : 'País desconocido'}</p>
                    </div>
                </div>
                <div class="info">
                    <p>Fecha de inicio: ${new Date(viaje.fechaInicio).toLocaleDateString()}</p>
                    <p>Fecha de fin: ${new Date(viaje.fechaFin).toLocaleDateString()}</p>
                    <p>Ciudades visitadas: ${viaje.ciudades.join(', ')}</p>
                    <p>Presupuesto: $${viaje.presupuesto.toLocaleString()}</p>
                    <p>Calificación: ${viaje.calificacion}</p>
                </div>
                <footer class="card-footer">
                    <a href="../html/editar_viaje.html?id=${viaje.id}" class="card-footer-item modificar-viaje" data-id="${viaje.id}">Modificar</a>
                    <a href="#" class="card-footer-item delete-viaje" data-id="${viaje.id}">Eliminar</a>
                </footer>
            </div>
        `;
        cardContainer.appendChild(card);
    });

    // Muestra tarjetas para los países visitados sin viajes
    for (const pais of paisesNoAsociados) {
        const flagUrl = await obtenerBandera(pais);

        const card = document.createElement('div');
        card.className = 'card is-horizontal';

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
                    <a href="../html/editar_viaje.html?pais=${pais}" class="card-footer-item modificar-viaje" data-pais="${pais}">Modificar</a>
                    <a href="#" class="card-footer-item delete-viaje" data-pais="${pais}">Eliminar</a>
                </footer>
            </div>
        `;
        cardContainer.appendChild(card);
    }
}

// Función para actualizar una card con datos editados
function actualizarCard(viaje) {
    const card = document.querySelector(`.card-footer-item[data-id="${viaje.id}"]`).closest('.card');
    if (card) {
        card.querySelector('.title.is-4').textContent = viaje.pais.nombre || 'País desconocido';
        card.querySelector('.info').innerHTML = `
            <p>Fecha de inicio: ${new Date(viaje.fechaInicio).toLocaleDateString()}</p>
            <p>Fecha de fin: ${new Date(viaje.fechaFin).toLocaleDateString()}</p>
            <p>Ciudades visitadas: ${viaje.ciudades.join(', ')}</p>
            <p>Presupuesto: $${viaje.presupuesto.toLocaleString()}</p>
            <p>Calificación: ${viaje.calificacion}</p>
        `;
    }
}

// Verificar existencia de usuario y obtener viajes
document.getElementById('buscar-viaje').addEventListener('click', async () => {
    const usuarioInput = document.getElementById('usuario');
    const usuario = usuarioInput.value.trim();
    const usuarioEncontrado = document.getElementById('usuario-encontrado');
    const usuarioDesconocido = document.getElementById('usuario-desconocido');
    const cardContainer = document.getElementById('card-container');

    usuarioEncontrado.style.display = 'none';
    usuarioDesconocido.style.display = 'none';
    cardContainer.style.display = 'none';
    usuarioInput.classList.remove('is-success', 'is-danger');

    if (usuario) {
        try {
            // Obtiene los viajes y países visitados del usuario
            const viajesResponse = await fetch(`http://localhost:3000/api/v1/users/${usuario}/viajes`);
            const userResponse = await fetch(`http://localhost:3000/api/v1/users/${usuario}`);

            if (viajesResponse.ok && userResponse.ok) {
                const viajesData = await viajesResponse.json();
                const userData = await userResponse.json();

                usuarioEncontrado.style.display = 'block';
                usuarioInput.classList.add('is-success');
                cardContainer.style.display = 'block';

                // Muestra los viajes y países visitados
                mostrarViajes(viajesData, userData.paisesVisitados);
            } else {
                usuarioDesconocido.style.display = 'block';
                usuarioInput.classList.add('is-danger');
            }
        } catch (error) {
            usuarioDesconocido.style.display = 'block';
            usuarioInput.classList.add('is-danger');
            console.error('Error:', error);
        }
    } else {
        alert('Por favor, ingrese un usuario.');
    }
});

// Evento para manejar la eliminación de un viaje
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-viaje')) {
        event.preventDefault();

        // Obtener el ID del viaje desde el atributo `data-id`
        const viajeId = event.target.dataset.id;

        if (viajeId) {
            const confirmar = confirm('¿Estás seguro de que quieres eliminar este viaje?');
            if (confirmar) {
                try {
                    // Realiza una petición DELETE al servidor
                    const response = await fetch(`http://localhost:3000/api/v1/viajes/${viajeId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        // Eliminar la tarjeta del DOM
                        const card = event.target.closest('.card');
                        card.remove();
                        alert('El viaje ha sido eliminado con éxito.');
                    } else {
                        alert('No se pudo eliminar el viaje. Intente nuevamente.');
                    }
                } catch (error) {
                    console.error('Error al eliminar el viaje:', error);
                    alert('Hubo un error al eliminar el viaje.');
                }
            }
        }
    }
});
