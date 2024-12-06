let minimo = 0;
let maximo = 20;

function fetchPaises(minimo, maximo) {
    fetch("https://restcountries.com/v3.1/all")
        .then(response => response.json())
        .then(datos => {
            // Ordenar los países alfabéticamente
            let paisesOrdenados = datos.sort((a, b) => {
                let nombreA = a.name.common.toLowerCase();
                let nombreB = b.name.common.toLowerCase();
                return nombreA.localeCompare(nombreB);
            });
            
            let paises = paisesOrdenados.slice(minimo, minimo + maximo);

            let tabla = document.getElementById("paisesTabla");
            tabla.innerHTML = ""; // Limpia el contenido previo de la tabla

            for (let i = 0; i < paises.length; i += 5) { // Mostrar 5 países por fila
                let fila = document.createElement("tr");
                for (let j = i; j < i + 5 && j < paises.length; j++) {
                    let celda = document.createElement("td");
                    let nombrePais = paises[j].name.common;

                    let link = document.createElement("a");
                    link.innerHTML = nombrePais;
                    link.href = ""; // Va la URL de la página del país
                    celda.append(link);

                    let img = document.createElement("img");
                    img.src = paises[j].flags.png;
                    img.alt = nombrePais;
                    img.width = 100;
                    celda.append(img);

                    fila.append(celda);
                }
                tabla.append(fila);
            }
        })
        .catch(error => console.error("Error al obtener los países:", error)); // Manejo de un posible error
}

function cambiarPagina(direccion) {
    minimo += direccion * maximo;
    if (minimo < 0) minimo = 0;
    fetchPaises(minimo, maximo);
}

// Asociar acción a los botones
document.getElementById("anterior").addEventListener("click", () => cambiarPagina(-1));
document.getElementById("siguiente").addEventListener("click", () => cambiarPagina(1));

// Cargar los países inicialmente
fetchPaises(minimo, maximo);
