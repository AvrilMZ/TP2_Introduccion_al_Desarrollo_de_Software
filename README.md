# Introduccion al Desarrollo de Software | TP2 | 2C - 2024

### Objetivo

Desarrollar un sitio web completo utilizando las tecnologías vistas a lo largo de la materia. El mismo constará de un frontend y un backend, con persistencia de datos utilizando una base de datos.

### Intergantes:

- **111341** - [Abril Belén Nuñez](https://github.com/abbnunez)
- **112626** - [Ana Provvisionato](https://github.com/anaprovvi)
- **112563** - [Avril Victoria Morfeo Zerbi](https://github.com/AvrilMZ)
- **112541** - [Facundo Camilo Stifman](https://github.com/facustifman)

### Tecnologías utilizadas

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Base de datos**: PostgreSQL

### Herramientas utilizadas

- **Frontend**: Bulma
- **Backend**: Bruno, DBeaver, Prisma
- **DevOps**: Docker Compose

## WorldTracker
WorldTracker es una página web que permite a los usuarios registrar los países que han visitado, rellenar un formulario sobre su experiencia además de contar con información de cada país.

API utilizada: [REST Countries](https://restcountries.com/)

### Instrucciones para correr el proyecto

Antes de ejecutar el proyecto, hay que tener instaladas las siguientes herramientas:

- Docker (última versión estable)
- Node.js (LTS)

**Pasos a seguir:**

1. Clonar el repositorio:

```bash
git clone <clave_ssh>
```

2. Entrar en el directorio del proyecto:

```bash
cd <direccion_local_repositorio>
```

3. Renombra el archivo 'example.env' a '.env' y luego, usándolo como modelo, modifica los detalles con tu base de datos:

```bash
cp .example.env .env
```

4. Instalar las dependencias del proyecto:

```bash
npm install
```

5. Generar el cliente de Prisma:

```bash
npx prisma generate
```

6. Aplicar migraciones para crear tablas en la base de datos:

```bash
npx prisma migrate dev
```

7. Levantar el servidor del Backend:

```bash
npm run dev
```

8. Levantar el servidor del Frontend (en una terminal aparte):

```bash
cd <direccion_local_repositorio>
cd Frontend
npm install
npm run start

```
