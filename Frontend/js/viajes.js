// Verificar existencia de usuario
document.getElementById('buscar-viaje').addEventListener('click', async () => {
    const usuarioInput = document.getElementById('usuario');
    const usuario = usuarioInput.value.trim(); // Se usa 'trim' para eliminar espacios innecesarios
    const usuarioEncontrado = document.getElementById('usuario-encontrado');
    const usuarioDesconocido = document.getElementById('usuario-desconocido');

    usuarioEncontrado.style.display = 'none';
    usuarioDesconocido.style.display = 'none';
    usuarioInput.classList.remove('is-success', 'is-danger');

    if (usuario) {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/users?usuario=${usuario}`);
            if (response.ok) {
                const viajes = await response.json();
                if (viajes.length > 0) {
                    usuarioEncontrado.style.display = 'block';
                    usuarioInput.classList.add('is-success');
                    mostrarViajes(viajes);
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

// Mostrar viajes pertenecientes al usuario
function mostrarViajes(viajes) {
    const cardContainer = document.getElementById('card-container');
    cardContainer.innerHTML = '';

    viajes.forEach(viaje => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="content">
                <h5 class="card-title">Viaje a ${viaje.pais.nombre}</h5>
                <p>Fecha de inicio: ${new Date(viaje.fecha_inicio).toLocaleDateString()}</p>
                <p>Fecha de fin: ${new Date(viaje.fecha_fin).toLocaleDateString()}</p>
                <p>Ciudades visitadas: ${viaje.ciudades.join(', ')}</p>
                <p>Presupuesto: $${viaje.presupuesto.toLocaleString()}</p>
                <p>Calificación: ${viaje.calificacion}</p>
            </div>
        `;
        cardContainer.appendChild(card);
    });
}