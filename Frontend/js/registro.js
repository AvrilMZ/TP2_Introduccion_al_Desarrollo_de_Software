document.addEventListener('DOMContentLoaded', function() {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(countries => {
            cargarPaisesSelect(countries);
            cargarPaisesMultiSelect(countries);
            cargarIdiomas(countries);
        });

    // Paises para la nacionalidad
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

    // Paises para países visitados
    function cargarPaisesMultiSelect(countries) {
        const paisesContainer = document.getElementById('paises-container');

        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name.common;
            option.textContent = country.name.common;
            paisesContainer.appendChild(option);
        });

        setTimeout(() => new MultiSelectTag('paises-container'), 0);
    }

    // Idiomas que habla
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
