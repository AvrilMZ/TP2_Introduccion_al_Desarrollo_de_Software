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
        const response = await fetch('/api/v1/paises', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nuevoPais),
        });
    
        // Muestra la respuesta como texto antes de intentar parsearla
        const responseText = await response.text();
        console.log("Respuesta del servidor:", responseText);
    
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor.');
        }
    
        // Intenta parsear solo si la respuesta es válida
        const paisCreado = JSON.parse(responseText);
        console.log('País creado con éxito:', paisCreado);
    
        alert('País creado con éxito.');
        window.location.href = 'paises.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al crear el país. Inténtalo de nuevo.');
    }
    
    });
  });