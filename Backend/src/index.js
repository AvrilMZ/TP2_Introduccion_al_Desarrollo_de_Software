const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
require("dotenv").config();
const prisma = new PrismaClient();
const axios = require("axios");

app.use(express.json());
app.use(cors());
app.use(express.static("../Frontend"));

app.get("/", (req, res) => {
  res.send("Viajandoo...");
});

// METODOS USERS
// Busca todos los usuarios
app.get("/api/v1/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Busca por usuario
app.get("/api/v1/users/:usuario", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      usuario: req.params.usuario,
    },
  });

  if (!user) {
    console.error("Usuario no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Usuario no encontrado");
  }

  res.json(user);
});

// devuelve los viajes del usuario
app.get("/api/v1/users/:usuario", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      usuario: req.params.usuario,
    },
    include: {
      viajes: true,
    },
  });

  if (!user) {
    console.error("Usuario no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Usuario no encontrado");
  }

  res.json(user.viaje);
});

// Agrega un nuevo usuario
app.post("/api/v1/usuarios", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    const user = await prisma.user.create({
      data: {
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        nacionalidad: req.body.nacionalidad,
        idiomas: req.body.idiomas,
        mail: req.body.mail,
        paises_visitados: req.body["paises-visitados"],
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error en el backend:", error);

    //error 'p2002' de prisma es para cuando hay un campo único duplicado
    if (error.code === "P2002") {
      return res.status(400).json({ error: "El mail o usuario ya está en uso" });
    }

    return res.status(500).json({ error: "Hubo un problema al crear el usuario" });
  }
});

//Elimina un usuario
app.delete("/api/v1/users/:usuario", async (req, res) => {
  const userUsuario = req.params.usuario;
  const user = await prisma.user.findUnique({
    where: {
      usuario: userUsuario,
    },
  });

  if (!user) {
    console.error("Usuario no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Usuario no encontrado");
  }

  await prisma.user.delete({
    where: {
      usuario: userUsuario,
    },
  });

  res.send(`Usuario ${userUsuario} eliminado exitosamente`);
});

//Actualiza un usuario
app.put("/api/v1/users/:id", async (req, res) => {
  let user = await prisma.user.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
  });

  if (!user) {
    console.error("Usuario no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Usuario no encontrado");
  }

  user = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      nombre: req.body.nombre,
      usuario: req.body.usuario,
      nacionalidad: req.body.nacionalidad,
      idiomas: req.body.idiomas,
      contacto: req.body.contacto,
      paises_visitados: req.body.paises_visitados,
    },
  });

  res.send(user);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//METODOS VIAJES
//Busco todos los viajes
app.get("/api/v1/viajes", async (req, res) => {
  const viajes = await prisma.viaje.findMany({
    include: {
      pais: true,
      usuario: true,
    },
  });
  res.json(viajes);
});

//Busco viaje por id
app.get("/api/v1/viajes/:id", async (req, res) => {
  const viaje = await prisma.viaje.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      pais: true,
      usuario: true,
    },
  });

  if (!user) {
    console.error("Viaje no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Viaje no encontrado");
  }
  res.json(viaje);
});

// Crear un viaje
app.post("/api/v1/viajes", async (req, res) => {
  const {
    pais, // Nombre del país
    usuario, // Nombre del usuario
    fechaInicio,
    fechaFin,
    ciudades,
    presupuesto,
    calificacion,
  } = req.body;

  if (
    !pais ||
    !usuario ||
    !fechaInicio ||
    !fechaFin ||
    !ciudades ||
    !presupuesto ||
    !calificacion
  ) {
    console.error("Todos los campos son obligatorios: ", error);
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  //verifico que existe el pais
  try {
    const paisData = await prisma.pais.findUnique({
      where: { nombre: pais },
    });

    if (!paisData) {
      console.error("El usuario especificado no existe: ", error);
      return res.redirect("/html/error.html?code=404&mensaje=El país especificado no existe");
    }

    //verifico que existe el usuario
    const user = await prisma.user.findUnique({
      where: { usuario: usuario },
    });

    if (!user) {
      console.error("El usuario especificado no existe: ", error);
      return res.redirect("/html/error.html?code=404&mensaje=El usuario especificado no existe");
    }

    const nuevoViaje = await prisma.viaje.create({
      data: {
        paisId: paisData.id,
        nombreUsuario: usuario,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        ciudades,
        presupuesto: parseFloat(presupuesto),
        calificacion: parseInt(calificacion),
      },
    });

    res.status(201).json(nuevoViaje);
  } catch (error) {
    console.error("Ocurrió un error al crear el viaje: ", error);
    return res.status(500).json({ error: "Ocurrió un error al crear el viaje" });
  }
});

// Actualizar un viaje
app.put("/api/v1/viajes/:id", async (req, res) => {
  const viajeId = parseInt(req.params.id);
  const {
    pais,
    usuario,
    fechaInicio,
    fechaFin,
    ciudades,
    presupuesto,
    calificacion,
  } = req.body;

  try {
    const viajeExistente = await prisma.viaje.findUnique({
      where: { id: viajeId },
    });

    if (!viajeExistente) {
      console.error("Viaje no encontrado: ", error);
      return res.redirect("/html/error.html?code=404&mensaje=Viaje no encontrado");
    }

    let paisId = viajeExistente.paisId;
    if (pais) {
      const paisData = await prisma.pais.findUnique({
        where: { nombre: pais },
      });

      if (!paisData) {
        console.error("El país especificado no existe: ", error);
        return res.redirect("/html/error.html?code=404&mensaje=El país especificado no existe");
      }
      paisId = paisData.id;
    }

    let nombreUsuario = viajeExistente.nombreUsuario;
    if (usuario) {
      const user = await prisma.user.findUnique({
        where: { usuario: usuario },
      });

      if (!user) {
        console.error("El usuario especificado no existe: ", error);
        return res.redirect("/html/error.html?code=404&mensaje=El usuario especificado no existe");
      }
      nombreUsuario = usuario;
    }

    const viajeActualizado = await prisma.viaje.update({
      where: { id: viajeId },
      data: {
        paisId,
        nombreUsuario,
        fechaInicio: fechaInicio
          ? new Date(fechaInicio)
          : viajeExistente.fechaInicio,
        fechaFin: fechaFin ? new Date(fechaFin) : viajeExistente.fechaFin,
        ciudades: ciudades || viajeExistente.ciudades,
        presupuesto: parseFloat(presupuesto) || viajeExistente.presupuesto,
        calificacion: parseInt(calificacion) || viajeExistente.calificacion,
      },
    });

    res.json(viajeActualizado);
  } catch (error) {
    console.error("Error al actualizar el viaje: ", error);
    return res.status(500).json({ error: "Error al actualizar el viaje" });
  }
});

app.delete("/api/v1/viajes/:id", async (req, res) => {
  const userViaje = req.params.viaje;
  const viaje = await prisma.viaje.findUnique({
    where: {
      viaje: userViaje,
    },
  });

  if (!viaje) {
    console.error("Viaje no encontrado: ", error);
    return res.redirect("/html/error.html?code=404&mensaje=Viaje no encontrado");
  }

  await prisma.viaje.delete({
    where: {
      viaje: userViaje,
    },
  });

  res.send(`Viaje ${userViaje} eliminado exitosamente`);
});

//METODOS PAISES
// Ruta para traer y guardar países desde la API
async function getCountriesFromAPI() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // Timeout de 20 segundos

  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,capital,languages,currencies,region",
      { signal: controller.signal }
    );

    if (!response.ok) {
      console.error("Error al obtener el países: ", error);
      return res.status(500).json({ error: "Error al obtener el países" });
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("La solicitud fue abortada debido al timeout: ", error);
      return res.status(504).json({ error: "La solicitud fue abortada debido al timeout" });

    } else {
      console.error("Error de fetch: ", error);
      return res.status(500).json({ error: "Error de fetch" });
    }

  } finally {
    clearTimeout(timeout);
  }
}

async function saveCountriesToDB() {
  try {
    const countries = await getCountriesFromAPI();

    const countryData = countries.map((country, index) => ({
      id: index + 1,
      nombre: country.name.common,
      capital: country.capital ? country.capital[0] : null,
      idiomas: country.languages ? Object.values(country.languages) : [],
      moneda: country.currencies
        ? Object.values(country.currencies)
          .map((currency) => currency.name)
          .join(", ")
        : null,
      continente: country.region,
    }));

    await prisma.viaje.deleteMany();
    await prisma.pais.deleteMany();

    for (const country of countryData) {
      await prisma.pais.create({
        data: country,
      });
    }

    console.log("Todos los países se guardaron en la base de datos.");
  } catch (error) {
    console.error("Error guardando países en la base de datos: ", error);
    return res.status(500).json({ error: "Error guardando países en la base de datos" });
  }
}
// llamada para guardar los países en la base de datos
saveCountriesToDB();

// Ruta para obtener todos los países
app.get("/api/v1/paises", async (req, res) => {
  try {
    const paises = await prisma.pais.findMany({
      orderBy: { nombre: "asc" },
      take: 250, // Limitar a los primeros 250 países
    });
    res.json(paises);
  } catch (error) {
    console.error("Error al actualizar el viaje: ", error);
    return res.status(500).json({ error: "Error interno al actualizar el viaje" });
  }
});

// Ruta para obtener un país por ID
app.get("/api/v1/paises/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pais = await prisma.pais.findUnique({
      where: { id: parseInt(id) },
      include: { Viaje: true },
    });

    if (!pais) {
      console.error("País no encontrado: ", id);
      return res.redirect("/html/error.html?code=404&mensaje=País no encontrado");
    }

    res.status(200).json(pais);
  } catch (error) {
    console.error("Error al obtener el país: ", error);
    return res.status(500).json({ error: "Error interno al obtener el país" });
  }
});