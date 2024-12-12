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
async function mostrarViajes(viajes) {
    const cardContainer = document.getElementById('card-container');
    cardContainer.innerHTML = '';

    const viajesConBanderas = await agregarBanderas(viajes); // Aseguramos que cada viaje tenga una bandera
    viajesConBanderas.forEach(viaje => {
        const pais = viaje.pais; // Asegúrate de que viaje tenga el campo pais
        const flagUrl = pais && pais.flags ? pais.flags.png : 'https://via.placeholder.com/150'; // Imagen por defecto si falta

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
                    <p>Ciudades visitadas: ${viaje.ciudades}</p>
                    <p>Presupuesto: $${viaje.presupuesto.toLocaleString()}</p>
                    <p>Calificación: ${viaje.calificacion}</p>
                </div>
                <footer class="card-footer">
                    <a href="../html/editar_viaje.html" class="card-footer-item modificar-viaje" data-id="${viaje.id}">Modificar</a>
                    <a href="#" class="card-footer-item delete-viaje" data-id="${viaje.id}">Eliminar</a>
                </footer>
            </div>
        `;
        cardContainer.appendChild(card);
    });

    // Agregar eventos para eliminar viajes
    document.querySelectorAll('.delete-viaje').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            const viajeId = button.getAttribute('data-id');
            try {
                const response = await fetch(`http://localhost:3000/api/v1/viajes/${viajeId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert(`Viaje ${viajeId} eliminado exitosamente.`);
                    button.closest('.card').remove(); // Eliminar la tarjeta de la interfaz
                } else {
                    console.error('Error al eliminar el viaje:', await response.json());
                }
            } catch (error) {
                console.error('Error al realizar la solicitud:', error);
            }
        });
    });
}

// Verificar existencia de usuario
document.getElementById('buscar-viaje').addEventListener('click', async () => {
    const usuarioInput = document.getElementById('usuario');
    const usuario = usuarioInput.value.trim(); // Se usa 'trim' para eliminar espacios innecesarios
    const usuarioEncontrado = document.getElementById('usuario-encontrado');
    const usuarioDesconocido = document.getElementById('usuario-desconocido');
    const cardContainer = document.getElementById('card-container');

    usuarioEncontrado.style.display = 'none';
    usuarioDesconocido.style.display = 'none';
    cardContainer.style.display = 'none';
    usuarioInput.classList.remove('is-success', 'is-danger');

    if (usuario) {
        try {
            // Obtener los viajes y países visitados del usuario usando su nombre de usuario
            const viajesResponse = await fetch(`http://localhost:3000/api/v1/users/${usuario}/viajes`);
            if (viajesResponse.ok) {
                const viajesData = await viajesResponse.json();
                const userResponse = await fetch(`http://localhost:3000/api/v1/users/${usuario}`);
                const userData = await userResponse.json();
                const paisesVisitados = userData.paisesVisitados; // Obtener los países visitados del usuario

                if (viajesData && viajesData.length > 0) {
                    usuarioEncontrado.style.display = 'block';
                    usuarioInput.classList.add('is-success');
                    mostrarViajes(viajesData, paisesVisitados);
                    cardContainer.style.display = 'block';
                } else {
                    usuarioDesconocido.style.display = 'block';
                    usuarioInput.classList.add('is-danger');
                }
            } else {
                usuarioDesconocido.style.display = 'block';
                usuarioInput.classList.add('is-danger');
                console.error('Error al buscar los viajes');
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