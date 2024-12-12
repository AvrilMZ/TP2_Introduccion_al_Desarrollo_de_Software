const path = require("path");
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
app.use(express.static(path.join(__dirname, "../Frontend/html")));

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
    console.error("Usuario no encontrado");
    return res.redirect("error.html?code=404&mensaje=Usuario no encontrado");
  }

  res.json(user);
});

// Devuelve los viajes del usuario
app.get("/api/v1/users/:usuario/viajes", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        usuario: req.params.usuario,
      },
      include: {
        Viaje: {
          include: {
            pais: true, // Incluir la información del país en la respuesta
          },
        },
      },
    });

    if (!user) {
      console.error("Usuario no encontrado");
      return res.redirect("error.html?code=404&mensaje=Usuario no encontrado");
    }

    res.json(user.Viaje);
  } catch (error) {
    console.error("Error al obtener los viajes del usuario:", error);
    res.status(500).json({ error: "Error al obtener los viajes del usuario" });
  }
});

// Agrega un nuevo usuario
app.post("/api/v1/users", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        nacionalidad: req.body.nacionalidad,
        idiomas: req.body.idiomas,
        mail: req.body.mail,
      },
    });

    // Manejar países visitados
    const paisesVisitados = req.body.paisesVisitados || [];
    for (const paisNombre of paisesVisitados) {
      // Buscar el país en la base de datos
      const pais = await prisma.pais.findUnique({
        where: { nombre: paisNombre },
      });

      // Si el país existe, asociarlo como un viaje
      if (pais) {
        await prisma.viaje.create({
          data: {
            paisId: pais.id,
            usuarioId: user.id,
            fechaInicio: null,
            fechaFin: null,
            ciudades: "",
            presupuesto: 0,
            calificacion: 0,
          },
        });
      }
    }

    res.status(201).json({ user });
  } catch (error) {
    console.error("Error en el backend:", error);

    // Manejo del error 'P2002' de prisma (campo único duplicado)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "El mail o usuario ya está en uso" });
    }

    return res
      .status(500)
      .json({ error: "Hubo un problema al crear el usuario" });
  }
});

// Elimina un usuario

app.delete("/api/v1/users/:usuario", async (req, res) => {
  const userUsuario = req.params.usuario;

  const user = await prisma.user.findUnique({
    where: {
      usuario: userUsuario,
    },
  });

  if (!user) {
    console.error("Usuario no encontrado");
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  try {
    // con esto elimino los registros de usuario en la tabla de viaje
    await prisma.viaje.deleteMany({
      where: {
        nombreUsuario: userUsuario,
      },
    });

    await prisma.user.delete({
      where: {
        usuario: userUsuario,
      },
    });

    res.send(`Usuario ${userUsuario} eliminado exitosamente`);
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res
      .status(500)
      .send("Error al eliminar el usuario. Inténtalo nuevamente más tarde.");
  }
});

// METODOS VIAJES
// Busco todos los viajes
app.get("/api/v1/viajes", async (req, res) => {
  const viajes = await prisma.viaje.findMany({
    include: {
      pais: true,
      usuario: true,
    },
  });
  res.json(viajes);
});

// Busco viaje por id
app.get("/api/v1/viajes/:id", async (req, res) => {
  const viaje = await prisma.viaje.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      pais: true,
      usuario: true,
    },
  });

  if (!viaje) {
    console.error("Viaje no encontrado");
    return res.redirect("error.html?code=404&mensaje=Viaje no encontrado");
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
    console.error("Todos los campos son obligatorios");
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Verifico que existe el pais
  try {
    const paisData = await prisma.pais.findUnique({
      where: { nombre: pais },
    });

    if (!paisData) {
      console.error("El usuario especificado no existe");
      return res.redirect(
        "error.html?code=404&mensaje=El país especificado no existe"
      );
    }

    // Verifico que existe el usuario
    const user = await prisma.user.findUnique({
      where: { usuario: usuario },
    });

    if (!user) {
      console.error("El usuario especificado no existe");
      return res.redirect(
        "error.html?code=404&mensaje=El usuario especificado no existe"
      );
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
    return res
      .status(500)
      .json({ error: "Ocurrió un error al crear el viaje" });
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
      console.error("Viaje no encontrado");
      return res.redirect("error.html?code=404&mensaje=Viaje no encontrado");
    }

    let paisId = viajeExistente.paisId;
    if (pais) {
      const paisData = await prisma.pais.findUnique({
        where: { nombre: pais },
      });

      if (!paisData) {
        console.error("El país especificado no existe");
        return res.redirect(
          "error.html?code=404&mensaje=El país especificado no existe"
        );
      }
      paisId = paisData.id;
    }

    let nombreUsuario = viajeExistente.nombreUsuario;
    if (usuario) {
      const user = await prisma.user.findUnique({
        where: { usuario: usuario },
      });

      if (!user) {
        console.error("El usuario especificado no existe");
        return res.redirect(
          "error.html?code=404&mensaje=El usuario especificado no existe"
        );
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

// Eliminar un viaje
app.delete("/api/v1/viajes/:id", async (req, res) => {
  const viajeId = parseInt(req.params.id);
  try {
    const viaje = await prisma.viaje.findUnique({
      where: {
        id: viajeId,
      },
    });

    if (!viaje) {
      console.error("Viaje no encontrado");
      return res.redirect("error.html?code=404&mensaje=Viaje no encontrado");
    }

    await prisma.viaje.delete({
      where: {
        id: viajeId,
      },
    });

    console.log(`Viaje eliminado exitosamente`);
    res.send(`Viaje ${viajeId} eliminado exitosamente`);
  } catch (error) {
    console.error("Error al eliminar el viaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// METODOS PAISES
// Ruta para traer y guardar países desde la API
async function Agarrar_paises_api() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // Timeout de 20 segundos

  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,capital,languages,currencies,region",
      { signal: controller.signal }
    );

    if (!response.ok) {
      console.error("Error al obtener el países");
      return res.status(500).json({ error: "Error al obtener el países" });
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("La solicitud fue abortada debido al timeout: ", error);
      return res
        .status(504)
        .json({ error: "La solicitud fue abortada debido al timeout" });
    } else {
      console.error("Error de fetch: ", error);
      return res.status(500).json({ error: "Error de fetch" });
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Guardar países en la base de datos
async function Guardar_paisesDB() {
  try {
    const countries = await Agarrar_paises_api();

    const countryData = countries.map((country, index) => ({
      id: index + 1,
      nombre: country.name.common,
      capital: country.capital ? country.capital[0] : "Indefinido",
      idiomas: country.languages ? Object.values(country.languages) : [],
      moneda: country.currencies
        ? Object.values(country.currencies)
            .map((currency) => currency.name)
            .join(", ")
        : null,
      continente: country.region,
    }));

    for (const country of countryData) {
      await prisma.pais.upsert({
        where: { id: country.id },
        update: country,
        create: country,
      });
    }

    console.log("Todos los países se guardaron en la base de datos.");
  } catch (error) {
    console.error("Error guardando países en la base de datos: ", error);
  }
}
// llamada para guardar los países en la base de datos
Guardar_paisesDB();

// Ruta para obtener todos los países
app.get("/api/v1/paises", async (req, res) => {
  try {
    const paises = await prisma.pais.findMany({
      orderBy: { nombre: "asc" },
      take: 250, // Limitar a los primeros 250 países
    });
    res.json(paises);
  } catch (error) {
    console.error("Error interno al obtener el países: ", error);
    return res
      .status(500)
      .json({ error: "Error interno al obtener el países" });
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
      return res.redirect("error.html?code=404&mensaje=País no encontrado");
    }

    res.status(200).json(pais);
  } catch (error) {
    console.error("Error al obtener el país: ", error);
    return res.status(500).json({ error: "Error interno al obtener el país" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
