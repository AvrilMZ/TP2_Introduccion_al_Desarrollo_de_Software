// Evento para buscar el usuario
document
	.getElementById('buscar-usuario')
	.addEventListener('click', async (event) => {
		event.preventDefault();

		const usuarioInput = document.getElementById('usuario');
		const usuario = usuarioInput.value.trim();
		const usuarioEncontrado = document.getElementById('usuario-encontrado');
		const usuarioDesconocido = document.getElementById('usuario-desconocido');

		// Limpia mensajes previos
		usuarioEncontrado.style.display = 'none';
		usuarioDesconocido.style.display = 'none';
		usuarioInput.classList.remove('is-success', 'is-danger');

		if (usuario) {
			try {
				const response = await fetch(
					`http://localhost:3000/api/v1/users/${usuario}`
				);
				if (response.ok) {
					const usuarioData = await response.json();

					// Rellenar el formulario
					document.getElementById('nombre').value = usuarioData.nombre || '';
					document.getElementById('mail').value = usuarioData.contacto || '';
					document.getElementById('pais-select').value =
						usuarioData.nacionalidad || '';

					const paisesContainer = document.getElementById('paises-container');
					paisesContainer.innerHTML = '';
					usuarioData.paisesVisitados.forEach((pais) => {
						const option = document.createElement('option');
						option.value = pais;
						option.textContent = pais;
						option.selected = true;
						paisesContainer.appendChild(option);
					});

					const idiomasContainer = document.getElementById('idiomas-container');
					idiomasContainer.innerHTML = '';
					usuarioData.idiomas.forEach((idioma) => {
						const option = document.createElement('option');
						option.value = idioma;
						option.textContent = idioma;
						option.selected = true;
						idiomasContainer.appendChild(option);
					});

					document
						.querySelectorAll('#confirmar input, #confirmar select')
						.forEach((field) => {
							field.disabled = false; // habilito los campos
						});

					usuarioEncontrado.style.display = 'block';
					usuarioInput.classList.add('is-success');
				} else {
					usuarioDesconocido.style.display = 'block';
					usuarioInput.classList.add('is-danger');
				}
			} catch (error) {
				usuarioDesconocido.style.display = 'block';
				usuarioInput.classList.add('is-danger');
				console.error('Error al buscar el usuario:', error);
			}
		} else {
			alert('Por favor, ingrese un usuario.');
		}
	});

document
	.getElementById('confirmar')
	.addEventListener('click', async (event) => {
		event.preventDefault();

		const usuarioInput = document.getElementById('usuario');
		const usuario = usuarioInput.value.trim();

		if (usuario) {
			const nombre = document.getElementById('nombre').value.trim();
			const contacto = document.getElementById('mail').value.trim();
			const nacionalidad = document.getElementById('pais-select').value;

			const paisesVisitados = Array.from(
				document.getElementById('paises-container').options
			)
				.filter((option) => option.selected)
				.map((option) => option.value);

			const idiomas = Array.from(
				document.getElementById('idiomas-container').options
			)
				.filter((option) => option.selected)
				.map((option) => option.value);

			try {
				const response = await fetch(
					`http://localhost:3000/api/v1/users/${usuario}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							nombre,
							usuario,
							nacionalidad,
							idiomas,
							contacto,
							paisesVisitados,
						}),
					}
				);

				if (response.ok) {
					const updatedUser = await response.json();
					alert('Usuario modificado con éxito');
				} else {
					const errorData = await response.json();
					alert(`Error al modificar el usuario: ${errorData.error}`);
				}
			} catch (error) {
				console.error('Error al modificar el usuario:', error);
				alert('Error al modificar el usuario. Inténtalo de nuevo más tarde.');
			}
		} else {
			alert('Por favor, ingrese un usuario.');
		}
	});

document
	.getElementById('eliminar-usuario')
	.addEventListener('click', async (event) => {
		event.preventDefault();

		const usuarioInput = document.getElementById('usuario');
		const usuario = usuarioInput.value.trim();

		if (!usuario) {
			alert('Por favor, ingrese un usuario para eliminar.');
			return;
		}

		const confirmacion = confirm(
			`¿Estás seguro de que deseas eliminar al usuario ${usuario}?`
		);
		if (!confirmacion) {
			return; // salgo si el usuario cancela
		}

		try {
			const response = await fetch(
				`http://localhost:3000/api/v1/users/:${usuario}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				alert(`Usuario ${usuario} eliminado exitosamente.`);
				usuarioInput.value = '';
				document.getElementById('nombre').value = '';
				document.getElementById('mail').value = '';
				document.getElementById('pais-select').value = '';
				document.getElementById('paises-container').innerHTML = '';
				document.getElementById('idiomas-container').innerHTML = '';
				document
					.querySelectorAll('#confirmar input, #confirmar select')
					.forEach((field) => {
						field.disabled = true;
					});
			} else {
				const errorData = await response.json();
				alert(`Error al eliminar el usuario: ${errorData.error}`);
			}
		} catch (error) {
			console.error('Error al realizar la solicitud de eliminación:', error);
			alert(
				'Error al eliminar el usuario. Por favor, inténtalo nuevamente más tarde.'
			);
		}
	});
