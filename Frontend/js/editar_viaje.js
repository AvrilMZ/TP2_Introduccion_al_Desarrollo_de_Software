let ciudadesArray = [];

document.addEventListener('DOMContentLoaded', function () {
  const viajeId = getViajeIdFromURL(); // Implementa esta función para obtener el ID del viaje desde la URL o algún otro método

  fetch('https://restcountries.com/v3.1/all')
    .then((response) => response.json())
    .then((countries) => {
      cargarPaisesSelect(countries);
    });

  // Cargar datos del viaje si estamos editando
  if (viajeId) {
    fetch(`/api/v1/viajes/${viajeId}`)
      .then((response) => response.json())
      .then((viaje) => {
        cargarDatosViaje(viaje);
      });
  }

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
      event.preventDefault(); // esto hace que no se envíe el form con un enter

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

        inputCiudades.value = '';
      }
    }
  });

  // Cargar datos del viaje en el formulario
  function cargarDatosViaje(viaje) {
    document.getElementById('pais-select').value = viaje.pais.nombre;
    ciudadesArray = viaje.ciudades;
    ciudadesArray.forEach((ciudad) => {
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
    });
    document.getElementById('fecha-inicio').value = viaje.fechaInicio.split('T')[0];
    document.getElementById('fecha-fin').value = viaje.fechaFin.split('T')[0];
    document.getElementById('presupuesto').value = viaje.presupuesto;
    document.getElementById('calificacion').value = viaje.calificacion;
  }

  // Manejar el envío del formulario
  document.getElementById('form-viaje').addEventListener('submit', async function (event) {
    event.preventDefault();

    const data = {
		pais: document.getElementById('pais-select').value,
		usuario: nombreUsuario, // Usar el nombre de usuario almacenado
		ciudades: ciudadesArray,
		fechaInicio: document.getElementById('fecha-inicio').value,
		fechaFin: document.getElementById('fecha-fin').value,
		presupuesto: parseFloat(document.getElementById('presupuesto').value),
		calificacion: parseInt(document.getElementById('calificacion').value),
	  };
    if (
      !data.pais ||
      !data.usuario ||
      !data.fechaInicio ||
      !data.fechaFin ||
      !data.ciudades.length ||
      !data.presupuesto ||
      !data.calificacion
    ) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
      alert('La fecha de inicio del viaje no puede ser posterior a la fecha de fin.');
      return;
    }

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

      const viajeActualizado = await response.json();
      console.log('Viaje actualizado:', viajeActualizado);
      alert('Viaje actualizado exitosamente');
      event.target.reset();
    } catch (error) {
      console.error('Error recibido del backend:', error);

      if (Array.isArray(error.error)) {
        mostrarErrores(error.error);
      } else {
        mostrarErrores(['Ocurrió un error inesperado. Intenta nuevamente.']);
      }
    }
  });

  function mostrarErrores(errores) {
    alert(errores.join('\n'));
  }

  function getViajeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }
});