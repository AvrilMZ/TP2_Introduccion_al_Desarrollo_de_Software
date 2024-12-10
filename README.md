# Introduccion al Desarrollo de Software | TP2 | 2C - 2024

### Objetivo
Desarrollar un sitio web completo utilizando las tecnologías vistas a lo largo de la materia. El mismo constará de un frontend y un backend, con persistencia de datos utilizando una base de datos.

### Intergantes:
* **111341** - [Abril Belén Nuñez](https://github.com/abbnunez)
* **112626** - [Ana Provvisionato](https://github.com/anaprovvi)
* **112563** - [Avril Victoria Morfeo Zerbi](https://github.com/AvrilMZ)
* **112541** - [Facundo Camilo Stifman](https://github.com/facustifman)

### Tecnologías utilizadas
* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js, Express
* **Base de datos**: PostgreSQL

### Herramientas utilizadas
* **Frontend**: Bulma
* **Backend**: Bruno, DBeaver, Prisma
* **DevOps**: Docker Compose

## WorldTracker
WorldTracker es una página web que permite a los usuarios registrar los países que han visitado y consultar información sobre ellos.

### Capturas de pantalla del funcionamiento
<!--
![Pantalla de inicio](ruta de la imagen)
![Formulario Usuario](ruta de la imagen)
![Paises a visitar](ruta de la imagen)
![3er entidad](ruta de la imagen)
-->

### Instrucciones para correr el proyecto
Antes de ejecutar el proyecto, hay que tener instaladas las siguientes herramientas:
* Docker (última versión estable)
* Node.js (LTS)

**Pasos a seguir:**
1. Clonar el repositorio:
```bash
git clone <clave_ssh>
```
2. Entrar en el directorio del proyecto:
```bash
cd <direccion_local_repositorio>
```
3. Levantar el contenedor de la base de datos con Docker:
```bash
cd Backend
docker-compose up -d
```
4. Renombra el archivo 'example.env' a '.env' y luego, usándolo como modelo, modifica los detalles de tu base de datos:
```bash
cp example.env .env
```
5. Instalar las dependencias del proyecto:
```bash
npm install
```
6. Generar el cliente de Prisma:
```bash
npx prisma generate
```
7. Aplicar migraciones para crear tablas en la base de datos:
```bash
npx prisma migrate dev
```
8. Levantar el servidor de la aplicación:
```bash
npm run dev
```
9. Levantar el servidor de la aplicación:
```bash
npm run dev
```
