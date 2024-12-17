document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('crear-pais-form');
	form.addEventListener('submit', async function (event) {
		event.preventDefault();

		function mostrarErrores(errores) {
			const errorContainer = document.getElementById('error-container');
			errorContainer.innerHTML = ''; // Limpiar errores anteriores
			errores.forEach((error) => {
				const errorItem = document.createElement('div');
				errorItem.textContent = error.msg;
				errorContainer.appendChild(errorItem);
			});
			errorContainer.style.display = 'block'; // Mostrar el contenedor de errores
		}

		const formData = new FormData(event.target);

		// Obtener valores del formulario

		const data = {
			nombre: formData.get('nombre'),
			capital: formData.get('capital'),
			idiomas: formData.get('idioma') ? [formData.get('idioma')] : [],
			moneda: formData.get('moneda'),
			continente: formData.get('continente'),
		};

		//envio los datos al backend
		try {
			const response = await fetch('http://localhost:3000/api/v1/paises', {
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
			const paisCreado = await response.json();
			console.log('Pais creado:', paisCreado);
			alert('Pais creado exitosamente');
			event.target.reset();
		} catch (error) {
			console.error('Error recibido del backend:', error);

			//si backend devuelve error especifico lo muestro
			if (Array.isArray(error.error)) {
				mostrarErrores(error.error.map((msg) => ({ msg })));
			} else {
				//sino msj generico (estos errores podriamos dejarlos solamente genericos arriba del form)
				const errorGeneral = document.getElementById('error-general');
				errorGeneral.textContent =
					'Ocurrió un error inesperado. Intenta nuevamente.';
				errorGeneral.style.display = 'block';
			}
		}
	});
});
