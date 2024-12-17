document.addEventListener('DOMContentLoaded', function () {
	fetch('https://restcountries.com/v3.1/all')
		.then((response) => response.json())
		.then((countries) => {
			cargarPaisesSelect(countries);
			cargarPaisesMultiSelect(countries);
			cargarIdiomas(countries);
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

	// Países para países visitados
	function cargarPaisesMultiSelect(countries) {
		const paisesContainer = document.getElementById('paises-container');
		countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
		countries.forEach((country) => {
			const option = document.createElement('option');
			option.value = country.name.common;
			option.textContent = country.name.common;
			paisesContainer.appendChild(option);
		});

		console.log(
			'Opciones cargadas para países visitados:',
			paisesContainer.innerHTML
		);
		// Inicializar MultiSelect
		setTimeout(() => new MultiSelectTag('paises-container'), 0);
	}

	// Idiomas
	function cargarIdiomas(countries) {
		const idiomasContainer = document.getElementById('idiomas-container');
		const idiomas = new Set();
		countries.forEach((country) => {
			if (country.languages) {
				Object.values(country.languages).forEach((language) =>
					idiomas.add(language)
				);
			}
		});

		Array.from(idiomas)
			.sort()
			.forEach((language) => {
				const option = document.createElement('option');
				option.value = language;
				option.textContent = language;
				idiomasContainer.appendChild(option);
			});

		setTimeout(() => new MultiSelectTag('idiomas-container'), 0);
	}

	const usuarioInput = document.getElementById('usuario');
	const buscarUsuarioButton = document.getElementById('buscar-usuario');
	const saveButton = document.querySelector('button[type="submit"]');

	deshabilitarCambios();

	buscarUsuarioButton.addEventListener('click', function (event) {
		event.preventDefault();
		const usuario = usuarioInput.value;
		fetch(`http://localhost:3000/api/v1/users/${usuario}`)
			.then((response) => response.json())
			.then((user) => {
				if (user) {
					document.querySelector('input[name="nombre"]').value = user.nombre;
					document.getElementById('mail').value = user.mail;
					document.getElementById('pais-select').value = user.nacionalidad;
					document.getElementById('paises-container').value =
						user.paisesVisitados.join(', ');
					document.getElementById('idiomas-container').value =
						user.idiomas.join(', ');
					habilitarCambios();
					document.getElementById('usuario-encontrado').style.display = 'block';
				} else {
					document.getElementById('usuario-desconocido').style.display =
						'block';
				}
			})
			.catch((error) => console.error('Error:', error));
	});

	saveButton.addEventListener('click', async (event) => {
		event.preventDefault();
		const usuario = usuarioInput.value;
		const usuarioActualizado = {
			nombre: document.querySelector('input[name="nombre"]').value,
			mail: document.getElementById('mail').value,
			nacionalidad: document.getElementById('pais-select').value,
			paisesVisitados: Array.from(
				document.getElementById('paises-container').selectedOptions
			).map((option) => option.value),
			idiomas: Array.from(
				document.getElementById('idiomas-container').selectedOptions
			).map((option) => option.value),
		};

		if (
			!usuarioActualizado.nombre ||
			!usuarioActualizado.mail ||
			!usuarioActualizado.nacionalidad ||
			usuarioActualizado.paisesVisitados.length === 0 ||
			usuarioActualizado.idiomas.length === 0
		) {
			alert('Por favor, completa todos los campos.');
			return;
		}

		try {
			const response = await fetch(
				`http://localhost:3000/api/v1/users/${usuario}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(usuarioActualizado),
				}
			);

			const responseText = await response.text();
			console.log('Response Text:', responseText);

			if (!response.ok) {
				throw new Error(responseText);
			}

			const data = JSON.parse(responseText);

			alert('Usuario actualizado exitosamente.');

			document.querySelector('input[name="nombre"]').value = data.nombre;
			document.getElementById('mail').value = data.mail;
			document.getElementById('pais-select').value = data.nacionalidad;

			// Limpiar y agregar países visitados
			const paisesContainer = document.getElementById('paises-container');
			Array.from(paisesContainer.options).forEach((option) => {
				option.selected = data.paisesVisitados.includes(option.value);
			});

			// Limpiar y agregar idiomas
			const idiomasContainer = document.getElementById('idiomas-container');
			Array.from(idiomasContainer.options).forEach((option) => {
				option.selected = data.idiomas.includes(option.value);
			});

			console.log('Data:', data);

			window.location.href = '../html/index.html';
		} catch (error) {
			console.error('Error al guardar los cambios:', error);
			alert('Error al guardar los cambios: ' + error.message);
		}
	});

	function habilitarCambios() {
		document.querySelector('input[name="nombre"]').disabled = false;
		document.getElementById('mail').disabled = false;
		document.getElementById('pais-select').disabled = false;
		document.getElementById('paises-container').disabled = false;
		document.getElementById('idiomas-container').disabled = false;
		saveButton.disabled = false;
	}

	function deshabilitarCambios() {
		document.querySelector('input[name="nombre"]').disabled = true;
		document.getElementById('mail').disabled = true;
		document.getElementById('pais-select').disabled = true;
		document.getElementById('paises-container').disabled = true;
		document.getElementById('idiomas-container').disabled = true;
		saveButton.disabled = true;
	}
});
