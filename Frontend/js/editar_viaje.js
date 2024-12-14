let ciudadesArray = [];

document.addEventListener('DOMContentLoaded', async function () {
    const viajeId = getViajeIdFromURL();

    // Cargar los países en el select
    fetch('https://restcountries.com/v3.1/all')
        .then((response) => response.json())
        .then((countries) => {
            cargarPaisesSelect(countries);
        });

    // Si hay un ID de viaje, cargar datos del viaje
    if (viajeId) {
        try {
            const response = await fetch(`/api/v1/viajes/${viajeId}`);
            if (response.ok) {
                const viaje = await response.json();
                cargarDatosViaje(viaje);
            } else {
                alert('No se pudo cargar la información del viaje.');
            }
        } catch (error) {
            console.error('Error al cargar los datos del viaje:', error);
        }
    }

    // Manejar el envío del formulario
    document.getElementById('form-viaje').addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            usuario: document.getElementById('usuario').value,
            pais: document.getElementById('pais-select').value,
            fechaInicio: document.getElementById('start-date').value,
            fechaFin: document.getElementById('end-date').value,
            ciudades: ciudadesArray,
            presupuesto: parseFloat(document.getElementById('presupuesto').value),
            calificacion: parseInt(document.getElementById('calificacion').value),
        };

        if (!validarDatos(data)) {
            alert('Por favor, completa todos los campos correctamente.');
            return;
        }

        try {
            const response = await fetch(`/api/v1/viajes/${viajeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const viajeActualizado = await response.json();
                alert('Viaje actualizado exitosamente.');
                // Actualizar la card en la ventana principal
                window.opener.actualizarCard(viajeActualizado);
                window.close(); // Cierra la ventana de edición
            } else {
                alert('Hubo un error al actualizar el viaje.');
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error);
        }
    });

    function cargarPaisesSelect(countries) {
        const paisSelect = document.getElementById('pais-select');
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        countries.forEach((country) => {
            const option = document.createElement('option');
            option.value = country.name.common;
            option.textContent = country.name.common;
            paisSelect.appendChild(option);
        });
    }

    function cargarDatosViaje(viaje) {
        document.getElementById('usuario').value = viaje.usuario || '';
        document.getElementById('pais-select').value = viaje.pais.nombre || '';
        document.getElementById('start-date').value = viaje.fechaInicio.split('T')[0];
        document.getElementById('end-date').value = viaje.fechaFin.split('T')[0];
        document.getElementById('presupuesto').value = viaje.presupuesto || '';
        document.getElementById('calificacion').value = viaje.calificacion || '';

        ciudadesArray = viaje.ciudades;
        const tagsContainer = document.getElementById('ciudades-tags');
        tagsContainer.innerHTML = '';

        ciudadesArray.forEach((ciudad) => {
            const tag = crearTagCiudad(ciudad);
            tagsContainer.appendChild(tag);
        });
    }

    function crearTagCiudad(ciudad) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = ciudad;

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '&times;';
        tag.appendChild(deleteButton);

        deleteButton.addEventListener('click', function () {
            ciudadesArray = ciudadesArray.filter((c) => c !== ciudad);
            tag.remove();
        });

        return tag;
    }

    // Manejar la entrada de ciudades
    const inputCiudades = document.getElementById('ciudades');
    const tagsContainer = document.getElementById('ciudades-tags');

    inputCiudades.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();

            const ciudad = inputCiudades.value.trim().toUpperCase();
            if (ciudad && !ciudadesArray.includes(ciudad)) {
                ciudadesArray.push(ciudad);
                const tag = crearTagCiudad(ciudad);
                tagsContainer.appendChild(tag);
                inputCiudades.value = '';
            }
        }
    });

    function validarDatos(data) {
        if (
            !data.pais ||
            !data.usuario ||
            !data.fechaInicio ||
            !data.fechaFin ||
            !data.ciudades.length ||
            !data.presupuesto ||
            isNaN(data.calificacion) ||
            data.calificacion < 0 ||
            data.calificacion > 5
        ) {
            return false;
        }

        if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
            return false;
        }

        return true;
    }

    function getViajeIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }
});
