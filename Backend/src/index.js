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
    res.status(404).send("Usuario no encontrado");
    return;
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
    res.status(404).send("Usuario no encontrado");
    return;
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

    if (error.code === "P2002") {
      //error 'p2002' de prisma es para cuando hay un campo único duplicado
      return res.status(400).json({
        error: ["El mail o usuario ya está en uso."],
      });
    }

    res.status(500).json({
      error: [
        "Hubo un problema al crear el usuario. Por favor, intenta nuevamente.",
      ],
    });
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
    res.status(404).send("Usuario no encontrado");
    return;
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
    res.status(404).send("Usuario no encontrado");
    return;
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

  if (!viaje) {
    res.status(404).send("Viaje no encontrado");
    return;
  }
  res.json(viaje);
});

// Crear un viaje
app.post("/api/v1/viajes", async (req, res) => {
  const {
    paisId,
    usuarioId,
    fecha_inicio,
    fecha_fin,
    ciudades,
    presupuesto,
    calificacion,
  } = req.body;

  if (!paisId || isNaN(paisId)) {
    return res
      .status(400)
      .json({ error: "El ID del país es obligatorio y debe ser un número." });
  }

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({
      error: "El ID del usuario es obligatorio y debe ser un número.",
    });
  }

  try {
    const pais = await prisma.pais.findUnique({
      where: { id: parseInt(paisId) },
    });
    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!pais) {
      return res.status(404).json({ error: "El país especificado no existe." });
    }

    if (!usuario) {
      return res
        .status(404)
        .json({ error: "El usuario especificado no existe." });
    }

    const nuevoViaje = await prisma.viaje.create({
      data: {
        paisId: parseInt(paisId),
        usuarioId: parseInt(usuarioId),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        ciudades,
        presupuesto: parseFloat(presupuesto) || 0,
        calificacion: parseInt(calificacion) || 0,
      },
    });

    res.status(201).json(nuevoViaje);
  } catch (error) {
    console.error("Error al crear el viaje:", error);
    res.status(500).json({
      error: "Ocurrió un error al crear el viaje. Intenta nuevamente.",
    });
  }
});

// Actualizar un viaje
app.put("/api/v1/viajes/:id", async (req, res) => {
  const viajeId = parseInt(req.params.id);
  const {
    paisId,
    usuarioId,
    fecha_inicio,
    fecha_fin,
    ciudades,
    presupuesto,
    calificacion,
  } = req.body;

  if (!viajeId || isNaN(viajeId)) {
    return res
      .status(400)
      .json({ error: "El ID del viaje es obligatorio y debe ser un número." });
  }

  try {
    const viajeExistente = await prisma.viaje.findUnique({
      where: { id: viajeId },
    });

    if (!viajeExistente) {
      return res.status(404).json({ error: "Viaje no encontrado." });
    }

    if (paisId) {
      const pais = await prisma.pais.findUnique({
        where: { id: parseInt(paisId) },
      });
      if (!pais) {
        return res
          .status(404)
          .json({ error: "El país especificado no existe." });
      }
    }

    if (usuarioId) {
      const usuario = await prisma.user.findUnique({
        where: { id: parseInt(usuarioId) },
      });
      if (!usuario) {
        return res
          .status(404)
          .json({ error: "El usuario especificado no existe." });
      }
    }

    const viajeActualizado = await prisma.viaje.update({
      where: { id: viajeId },
      data: {
        paisId: paisId || viajeExistente.paisId,
        usuarioId: usuarioId || viajeExistente.usuarioId,
        fecha_inicio: fecha_inicio
          ? new Date(fecha_inicio)
          : viajeExistente.fecha_inicio,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : viajeExistente.fecha_fin,
        ciudades: ciudades || viajeExistente.ciudades,
        presupuesto: presupuesto || viajeExistente.presupuesto,
        calificacion: calificacion || viajeExistente.calificacion,
      },
    });

    res.json(viajeActualizado);
  } catch (error) {
    console.error("Error al actualizar el viaje:", error);
    res.status(500).json({
      error: "Ocurrió un error al actualizar el viaje. Intenta nuevamente.",
    });
  }
});

//!METODOS PAISES

// Ruta para traer y guardar países desde la API
async function getCountriesFromAPI() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    if (!response.ok) {
      throw new Error(`Error al obtener países: ${response.statusText}`);
    }

    const countries = await response.json();

    // limito a los primeros 250 países para evitar llamadas innecesarias
    return countries
      .slice(0, 250)
      .sort((a, b) => a.name.common.localeCompare(b.name.common));
  } catch (error) {
    console.error("Error de fetch: ", error);
    throw error;
  }
}

// Función para guardar países en la base de datos
async function saveCountriesToDB() {
  try {
    const countries = await getCountriesFromAPI();

    const countryData = countries.map((country) => ({
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

    await prisma.pais.deleteMany();

    // Insertar los países con IDs manuales
    for (const country of countryData) {
      await prisma.pais.create({
        data: country,
      });
    }

    console.log("Todos los países se guardaron en la base de datos.");
  } catch (error) {
    console.error("Error guardando países en la base de datos:", error);
  }
}

// Llamada para guardar los países en la base de datos
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
    res
      .status(500)
      .json({ error: "Error fetching countries from the database" });
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
      return res.status(404).json({ error: "País no encontrado" });
    }

    res.status(200).json(pais);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el país" });
  }
});
