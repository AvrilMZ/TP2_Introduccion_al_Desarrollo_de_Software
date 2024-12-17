document.addEventListener('DOMContentLoaded', async () => {
	function getViajeIdFromURL() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('id');
		console.log('Id del viaje desde la url: ', id);
		return id;
	}

	const viajeId = getViajeIdFromURL(); // Obtener el ID del viaje desde la URL
	let ciudadesArray = []; // Array para almacenar las ciudades del viaje

	// Cargar la lista de países en el selector
	fetch('https://restcountries.com/v3.1/all')
		.then((response) => response.json())
		.then((countries) => {
			cargarPaisesSelect(countries);
		})
		.catch((error) =>
			mostrarErrorGeneral(
				'Error al cargar la lista de países. Intenta nuevamente.'
			)
		);

	// Cargar datos del viaje si hay un ID válido
	if (viajeId) {
		fetch(`http://localhost:3000/api/v1/viajes/${viajeId}`)
			.then((response) => {
				console.log('Rta del servidor: ', response);
				if (!response.ok) {
					throw new Error('Error al obtener los datos del viaje.');
				}
				return response.json();
			})
			.then((viaje) => {
				console.log('Datos del viaje: ', viaje);
				cargarDatosViaje(viaje);
			})
			.catch((error) => {
				console.error('Error al cargar el viaje:', error);
				mostrarErrorGeneral(
					'No se pudieron cargar los datos del viaje. Intenta nuevamente.'
				);
			});
	} else {
		mostrarErrorGeneral('No se encontró un ID válido para este viaje.');
	}

	// Manejar el evento de envío del formulario
	document
		.getElementById('form-viaje')
		.addEventListener('submit', async function (event) {
			event.preventDefault();

			const data = {
				pais: document.getElementById('pais-select').value,
				ciudades: ciudadesArray,
				fechaInicio: document.getElementById('fecha-inicio').value,
				fechaFin: document.getElementById('fecha-fin').value,
				presupuesto: parseFloat(document.getElementById('presupuesto').value),
				calificacion: parseInt(document.getElementById('calificacion').value),
			};

			console.log('Datos enviados:', data);

			// Validaciones
			if (
				!data.pais ||
				!data.fechaInicio ||
				!data.fechaFin ||
				!data.ciudades.length ||
				!data.presupuesto ||
				data.calificacion === undefined
			) {
				console.error('Error en validación:', data);
				mostrarErrorGeneral(
					'Por favor, completa todos los campos obligatorios.'
				);
				return;
			}

			if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
				mostrarErrorGeneral(
					'La fecha de inicio no puede ser posterior a la fecha de fin.'
				);
				return;
			}

			// Enviar los datos al backend
			try {
				const response = await fetch(`/api/v1/viajes/${viajeId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const error = await response.json();
					throw error;
				}

				alert('Viaje actualizado exitosamente.');
				window.location.href = '../html/viajes.html'; // Redirigir a la lista de viajes
			} catch (error) {
				console.error('Error al guardar los cambios:', error);
				mostrarErrorGeneral(error.message || 'No se pudo actualizar el viaje.');
			}
		});

	const inputCiudades = document.getElementById('ciudades');
	inputCiudades.addEventListener('keydown', function (event) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Evitamos que el formulario se envíe

			const ciudad = inputCiudades.value.trim(); // Capturamos y limpiamos el valor ingresado

			if (ciudad && !ciudadesArray.includes(ciudad)) {
				// Añadimos la ciudad al arreglo si no está duplicada
				ciudadesArray.push(ciudad);
				actualizarCiudadesTags(); // Actualizamos la lista de tags
				inputCiudades.value = ''; // Limpiamos el input
			}
		}
	});

	// Función para cargar datos del viaje en el formulario
	function cargarDatosViaje(viaje) {
		document.getElementById('pais-select').value = viaje.pais.nombre;
		document.getElementById('fecha-inicio').value =
			viaje.fechaInicio.split('T')[0];
		document.getElementById('fecha-fin').value = viaje.fechaFin.split('T')[0];
		document.getElementById('ciudades').value = viaje.ciudades.join(', ');
		document.getElementById('presupuesto').value = viaje.presupuesto;
		document.getElementById('calificacion').value = viaje.calificacion;

		ciudadesArray = viaje.ciudades || [];
		actualizarCiudadesTags();
	}

	// Función para actualizar las etiquetas de ciudades
	function actualizarCiudadesTags() {
		const tagsContainer = document.getElementById('ciudades-tags');
		tagsContainer.innerHTML = '';
		ciudadesArray.forEach((ciudad) => {
			const tag = document.createElement('span');
			tag.className = 'tag';
			tag.textContent = ciudad;

			const deleteButton = document.createElement('button');
			deleteButton.type = 'button';
			deleteButton.className = 'delete-button';
			deleteButton.innerHTML = '&times;';

			deleteButton.addEventListener('click', () => {
				ciudadesArray = ciudadesArray.filter((c) => c !== ciudad);
				actualizarCiudadesTags();
			});

			tag.appendChild(deleteButton);
			tagsContainer.appendChild(tag);
		});
	}

	// Función para cargar países en el selector
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

	// Mostrar mensajes de error
	function mostrarErrorGeneral(mensaje) {
		const errorGeneral = document.getElementById('error-general');
		errorGeneral.textContent = mensaje;
		errorGeneral.classList.remove('is-hidden');
		setTimeout(() => {
			errorGeneral.classList.add('is-hidden');
		}, 5000);
	}
});
