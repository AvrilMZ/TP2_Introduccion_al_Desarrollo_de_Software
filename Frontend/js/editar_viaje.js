let ciudadesArray = [];

document.addEventListener('DOMContentLoaded', function () {
    fetch('https://restcountries.com/v3.1/all')
        .then((response) => response.json())
        .then((countries) => {
            cargarPaisesSelect(countries);
        });

    // Países para la nacionalidad
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

    const inputCiudades = document.getElementById('ciudades');
    const tagsContainer = document.getElementById('ciudades-tags');

    // Array para almacenar las ciudades
    inputCiudades.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // esto hace q no se envie el form con un enter

            const ciudad = inputCiudades.value.trim().toUpperCase();
            if (ciudad && !ciudadesArray.includes(ciudad)) {
                ciudadesArray.push(ciudad);

                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = ciudad;

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'delete-button';
                deleteButton.innerHTML = '&times;';
                tag.appendChild(deleteButton);

                tagsContainer.appendChild(tag);

                deleteButton.addEventListener('click', function () {
                    ciudadesArray = ciudadesArray.filter((c) => c !== ciudad);
                    tagsContainer.removeChild(tag);
                });
            }

            inputCiudades.value = '';
        }
    });
});

document
    .querySelector('form')
    .addEventListener('submit', async function (event) {
        event.preventDefault();

        function mostrarErrores(errores) {
            const errorDiv = document.getElementById('error-mensajes');

            errorDiv.innerHTML = '';
            errores.forEach((error) => {
                const mensaje = document.createElement('p'); //crea un p para cada error
                mensaje.textContent = error.msg || error;
                errorDiv.appendChild(mensaje);
            });
            errorDiv.style.display = 'block'; // muestra el container de errores
        }

        const formData = new FormData(event.target);
        //guardo los valores de los inputs
        const data = {
            usuario: formData.get('usuario'),
            pais: formData.get('pais'),
            fechaInicio: formData.get('viaje-inicio'),
            fechaFin: formData.get('viaje-fin'),
            ciudades: ciudadesArray,
            presupuesto: formData.get('presupuesto'),
            calificacion: formData.get('calificacion'),
        };

        console.log('Datos enviados al backend:', data);

        //VALIDACIONES
        if (
            !data.usuario ||
            !data.pais ||
            !data.fechaFin ||
            !data.fechaInicio ||
            !data.presupuesto ||
            !data.calificacion
        ) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        if (new Date(data['viaje-inicio']) > new Date(data['viaje-fin'])) {
            alert(
                'La fecha de inicio del viaje no puede ser posterior a la fecha de fin.'
            );
            return;
        }

        //envio los datos al backend
        try {
            const response = await fetch('http://localhost:3000/api/v1/viajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            //si la rta falla, devuelvo el error para el catch
            if (!response.ok) {
                const error = await response.json();
                throw error;
            }

            //se crea, muestro una alerta y reinicio la pagina
            const viajeCreado = await response.json();
            console.log('Viaje creado:', viajeCreado);
            alert('Viaje agregado exitosamente');
            event.target.reset();
        } catch (error) {
            console.error('Error recibido del backend:', error);

            //si backend devuelve error especifico lo muestro
            if (Array.isArray(error.error)) {
                mostrarErrores(error.error);
            } else {
                mostrarErrores(['Ocurrió un error inesperado. Intenta nuevamente.']);
            }
        }
    });