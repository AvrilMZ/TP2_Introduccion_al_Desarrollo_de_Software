document.addEventListener('DOMContentLoaded', function () {
    // Cargar continentes en el selector de continentes
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(countries => {
            cargarContinentes(countries);
        })
        .catch(() => console.error("Error al cargar los continentes."));

    // Función para cargar continentes en un select
    function cargarContinentes(countries) {
        const continenteSelect = document.getElementById('continente');
        const continentes = new Set(countries.map(country => country.region).filter(Boolean));

        Array.from(continentes).sort().forEach(continente => {
            const option = document.createElement('option');
            option.value = continente;
            option.textContent = continente;
            continenteSelect.appendChild(option);
        });
    }
});

// Lógica del formulario: validaciones y envío al backend
document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Función para mostrar errores en el formulario
    function mostrarErrores(errores) {
        const errorDiv = document.getElementById('error-mensajes');
        errorDiv.innerHTML = '';
        errores.forEach(error => {
            const mensaje = document.createElement('p');
            mensaje.textContent = error.msg || error;
            errorDiv.appendChild(mensaje);
        });
        errorDiv.style.display = 'block';
    }

    // Capturar datos del formulario
    const formData = new FormData(event.target);
    const data = {
        nombre: formData.get('nombre'),
        capital: formData.get('capital'),
        idioma: formData.get('idioma'),
        moneda: formData.get('moneda'),
        continente: formData.get('continente')
    };

    // Validaciones de campos
    const errores = {};

    if (!data.nombre || data.nombre.trim().length < 3) {
        errores.nombre = 'El nombre del país debe tener al menos 3 caracteres.';
    }

    if (!data.capital || data.capital.trim() === '') {
        errores.capital = 'La capital es obligatoria.';
    }

    if (!data.idioma || data.idioma.trim() === '') {
        errores.idioma = 'El idioma es obligatorio.';
    }

    if (!data.moneda || data.moneda.trim() === '') {
        errores.moneda = 'La moneda es obligatoria.';
    }

    if (!data.continente || data.continente.trim() === '') {
        errores.continente = 'El continente es obligatorio.';
    }

    // Mostrar errores si existen
    if (Object.keys(errores).length > 0) {
        const erroresArray = Object.entries(errores).map(([campo, mensaje]) => ({ campo, msg: mensaje }));
        mostrarErrores(erroresArray);
        return;
    }

    // Enviar los datos al backend
    try {
        const response = await fetch('http://localhost:3000/api/v1/paises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Verificar la respuesta del servidor
        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        const paisCreado = await response.json();
        console.log('País creado:', paisCreado);
        alert('País creado exitosamente');
        event.target.reset();
    } catch (error) {
        console.error('Error recibido del backend:', error);

        // Mostrar errores específicos si los devuelve el backend
        if (Array.isArray(error.error)) {
            mostrarErrores(error.error.map(msg => ({ msg })));
        } else {
            const errorGeneral = document.getElementById('error-general');
            errorGeneral.textContent = 'Ocurrió un error inesperado. Intenta nuevamente.';
            errorGeneral.style.display = 'block';
        }
    }
});