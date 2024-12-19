document.addEventListener('DOMContentLoaded', async () => {
    const paisSelect = document.getElementById('pais-select');

    // Función para cargar los países disponibles para eliminar
    async function cargarPaises() {
        try {
            const response = await fetch('http://localhost:3000/api/v1/paises');
            if (response.ok) {
                const paises = await response.json();
                paisSelect.innerHTML = ''; // Limpiar el select antes de agregar las opciones
                paises.forEach((pais) => {
                    const option = document.createElement('option');
                    option.value = pais.id;  // ID como valor
                    option.textContent = pais.nombre;  // Nombre como texto
                    paisSelect.appendChild(option);
                });
            } else {
                console.error('Error al obtener países personalizados:', response.statusText);
                alert('Error al cargar la lista de países. Por favor, intentá nuevamente.');
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error al cargar la lista de países. Por favor, revisá tu conexión.');
        }
    }

    // Llamamos a la función de carga de países al iniciar
    cargarPaises();

    document.getElementById('eliminar_pais').addEventListener('click', async (event) => {
        event.preventDefault();

        const paisSelect = document.getElementById('pais-select');
        const paisId = paisSelect.value.trim();
        const paisNombre = paisSelect.options[paisSelect.selectedIndex].textContent;

        if (!paisId) {
            alert('Por favor, seleccioná un país para eliminar.');
            return;
        }

        const confirmacion = confirm(`¿Estás seguro de que deseas eliminar el país ${paisNombre}?`);
        if (!confirmacion) {
            return; // Salimos si el usuario cancela
        }

        try {
            const response = await fetch(`http://localhost:3000/api/v1/paises/${paisId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert(`País ${paisNombre} eliminado exitosamente.`);
                paisSelect.value = '';

                // Eliminar el país de localStorage
                let paisesCreados = JSON.parse(localStorage.getItem('paisesCreados')) || [];
                paisesCreados = paisesCreados.filter(pais => pais.id !== parseInt(paisId));  // Eliminamos el país por ID
                localStorage.setItem('paisesCreados', JSON.stringify(paisesCreados));

                // Actualizar la lista de países disponibles en el select
                cargarPaises();

            } else {
                const errorData = await response.json();
                alert(`Error al eliminar el país: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error al realizar la solicitud de eliminación:', error);
            alert('Error al eliminar el país. Por favor, intentá nuevamente más tarde.');
        }
    });
});
