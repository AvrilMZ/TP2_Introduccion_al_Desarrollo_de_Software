document
	.getElementById('eliminar_usuario')
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
			return; // Salgo si el usuario cancela
		}

		try {
			const response = await fetch(
				`http://localhost:3000/api/v1/users/${usuario}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				alert(`Usuario ${usuario} eliminado exitosamente.`);
				usuarioInput.value = '';
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
