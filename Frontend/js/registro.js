document.addEventListener('DOMContentLoaded', function () {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(countries => {
            cargarPaisesSelect(countries);
            cargarPaisesMultiSelect(countries);
            cargarIdiomas(countries);
        });

    // Países para la nacionalidad
    function cargarPaisesSelect(countries) {
        const paisSelect = document.getElementById('pais-select');
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        countries.forEach(country => {
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
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name.common;
            option.textContent = country.name.common;
            paisesContainer.appendChild(option);
        });

        console.log('Opciones cargadas para países visitados:', paisesContainer.innerHTML);
        // Inicializar MultiSelect
        setTimeout(() => new MultiSelectTag('paises-container'), 0);
    }

    // Idiomas
    function cargarIdiomas(countries) {
        const idiomasContainer = document.getElementById('idiomas-container');
        const idiomas = new Set();
        countries.forEach(country => {
            if (country.languages) {
                Object.values(country.languages).forEach(language => idiomas.add(language));
            }
        });

        Array.from(idiomas).sort().forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            idiomasContainer.appendChild(option);
        });

        setTimeout(() => new MultiSelectTag('idiomas-container'), 0);
    }
});

document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault();

    function mostrarErrores(errores) {
        const errorDiv = document.getElementById('error-mensajes');

        errorDiv.innerHTML = '';
        errores.forEach((error) => {
            const mensaje = document.createElement('p'); //crea un p para cada error
            mensaje.textContent = error.msg || error;
            errorDiv.appendChild(mensaje);
        });
        errorDiv.style.display = 'block'; // muestra el container de errores
    }


    const formData = new FormData(event.target);
    //guardo los valores de los inputs
    const data = {
        nombre: formData.get('nombre'),
        usuario: formData.get('usuario'),
        mail: formData.get('mail'),
        nacionalidad: formData.get('nacionalidad'),
        'paises-visitados': formData.getAll('paises-visitados[]'),
        idiomas: formData.getAll('idiomas[]'),
    };


    //VALIDACIONES
    const errores = {};

    if (data.usuario.length < 5) {
        errores.usuario = 'El usuario debe tener al menos 5 caracteres';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.mail)) {
        errores.mail = 'El email no es válido';
    }

    if (data['paises-visitados'].length === 0) {
        errores['paises-visitados'] = 'Selecciona al menos un país';
    }

    if (data.idiomas.length === 0) {
        errores.idiomas = 'Selecciona al menos un idioma';
    }

    //si hay errores en el {errores}, muestro su contenedor
    if (Object.keys(errores).length > 0) {
        const erroresArray = Object.entries(errores).map(([campo, mensaje]) => ({ campo, msg: mensaje }));
        mostrarErrores(erroresArray);
        return;
    }


    //envio los datos al backend
    try {
        const response = await fetch('http://localhost:3000/api/v1/users', {
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
        const usuarioCreado = await response.json();
        console.log('Usuario creado:', usuarioCreado);
        alert('Usuario creado exitosamente');
        event.target.reset();
    } catch (error) {
        console.error('Error recibido del backend:', error);

        //si backend devuelve error especifico lo muestro
        if (Array.isArray(error.error)) {
            mostrarErrores(error.error.map((msg) => ({ msg })));
        } else {
            //sino msj generico (estos errores podriamos dejarlos solamente genericos arriba del form)
            const errorGeneral = document.getElementById('error-general');
            errorGeneral.textContent = 'Ocurrió un error inesperado. Intenta nuevamente.';
            errorGeneral.style.display = 'block';
        }
    }
});
