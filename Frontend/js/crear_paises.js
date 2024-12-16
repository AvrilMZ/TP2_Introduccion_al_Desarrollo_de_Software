document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('crear-pais-form');
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Obtener valores del formulario
        const nombre = document.getElementById('nombre').value;
        const capital = document.getElementById('capital').value;
        const idiomas = document.getElementById('idioma').value;
        const moneda = document.getElementById('moneda').value;
        const continente = document.getElementById('continente').value;

        // Crear objeto con los datos del país
        const nuevoPais = {
            nombre,
            capital,
            idiomas,
            moneda,
            continente,
        };

        try {
            // Enviar los datos al servidor
            const response = await fetch('/api/v1/paises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoPais),
            });

            if (!response.ok) {
                throw new Error('Error al crear el país en el servidor.');
            }

            const paisCreado = await response.json();
            console.log('País creado con éxito:', paisCreado);

            // Redirección a paises.html
            alert('País creado con éxito.');
            window.location.href = 'paises.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al crear el país. Inténtalo de nuevo.');
        }
    });
});
