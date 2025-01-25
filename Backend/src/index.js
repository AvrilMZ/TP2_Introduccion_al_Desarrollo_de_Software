import path from "path";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Obtiene la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verificar que las variables de entorno estén configuradas
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  console.error("Las variables DATABASE_URL o DIRECT_URL no están configuradas.");
  process.exit(1);
}

// Inicializar Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl, // Usa DATABASE_URL para conectar con la base de datos
    },
  },
});

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../../Frontend")));

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

    // Manejar países visitados
    const paisesVisitados = req.body.paisesVisitados || [];
    const viajes = [];

    for (const paisNombre of paisesVisitados) {
      // Buscar el país en la base de datos
      const pais = await prisma.pais.findUnique({
        where: { nombre: paisNombre },
      });

      // Si el país existe, agregarlo a la lista de viajes
      if (pais) {
        viajes.push({
          paisId: pais.id,
          fechaInicio: null,
          fechaFin: null,
          ciudades: [],
          presupuesto: 0,
          calificacion: 0,
        });
      }
    }

    // Crear el usuario con los viajes y los países visitados
    const user = await prisma.user.create({
      data: {
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        nacionalidad: req.body.nacionalidad,
        idiomas: req.body.idiomas,
        mail: req.body.mail,
        paisesVisitados: paisesVisitados,
        Viaje: {
          create: viajes,
        },
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error en el backend:", error);

    // Manejo del error 'P2002' de prisma (campo único duplicado)
    if (error.code === "P2002") {
      res.status(400).json({ error: "El usuario ya existe" });
    } else {
      res.status(500).json({ error: "Error al crear el usuario" });
    }
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

// Editar un usuario existente
app.put("/api/v1/users/:usuario", async (req, res) => {
  const { usuario } = req.params;
  const { nombre, nacionalidad, idiomas, mail, paisesVisitados } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { usuario },
    });

    if (!user) {
      console.error("Usuario no encontrado");
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!nombre || !nacionalidad || !idiomas || !mail || !paisesVisitados) {
      console.error("Todos los campos son obligatorios");
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const updatedUser = await prisma.user.update({
      where: { usuario },
      data: {
        nombre,
        nacionalidad,
        idiomas,
        mail,
        paisesVisitados,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// METODOS VIAJES
// Busco todos los viajes
app.get("/api/v1/viajes", async (req, res) => {
  try {
    const viajes = await prisma.viaje.findMany({
      include: {
        pais: true,
        usuario: true,
      },
    });
    res.json(viajes);
  } catch (error) {
    console.error("Error al obtener los viajes:", error);
    res.status(500).json({ error: "Error interno al obtener los viajes" });
  }
});
// Busco viaje por id
app.get("/api/v1/viajes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const viaje = await prisma.viaje.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        pais: true,
        usuario: true,
      },
    });

    if (!viaje) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    res.status(200).json(viaje);
  } catch (error) {
    console.error("Error al obtener el viaje:", error);
    res.status(500).json({ error: "Error interno al obtener el viaje" });
  }
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
      console.error("El país especificado no existe");
      return res.status(404).json({ error: "El país especificado no existe" });
    }

    // Verifico que existe el usuario
    const user = await prisma.user.findUnique({
      where: { usuario: usuario },
    });

    if (!user) {
      console.error("El usuario especificado no existe");
      return res
        .status(404)
        .json({ error: "El usuario especificado no existe" });
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

    // Actualizamos el campo paisesVisitados del usuario agregando el nombre del país
    await prisma.user.update({
      where: { usuario: usuario },
      data: {
        paisesVisitados: {
          push: pais,
        },
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

// Editar un viaje existente
app.put("/api/v1/viajes/:id", async (req, res) => {
  const { id } = req.params;
  const { pais, ciudades, fechaInicio, fechaFin, presupuesto, calificacion } =
    req.body;

  try {
    // Validar país
    const paisData = await prisma.pais.findUnique({ where: { nombre: pais } });
    if (!paisData) {
      console.error("El país especificado no existe:", pais);
      return res.status(404).json({ error: "El país especificado no existe." });
    }

    // Actualizar viaje
    const viajeActualizado = await prisma.viaje.update({
      where: { id: parseInt(id) },
      data: {
        paisId: paisData.id,
        ciudades,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        presupuesto: parseFloat(presupuesto),
        calificacion: parseInt(calificacion),
      },
    });

    console.log("Viaje actualizado:", viajeActualizado);
    res.json(viajeActualizado);
  } catch (error) {
    console.error("Error al actualizar el viaje:", error);
    res.status(500).json({ error: "No se pudo actualizar el viaje." });
  }
});

// Eliminar un viaje
app.delete("/api/v1/viajes/:viajeId", async (req, res) => {
  const { viajeId } = req.params;

  try {
    const viaje = await prisma.viaje.findUnique({
      where: { id: parseInt(viajeId, 10) },
      include: { pais: true, usuario: true },
    });

    if (!viaje) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    const pais = viaje.pais?.nombre;
    const usuario = viaje.usuario?.usuario;

    // Eliminar el viaje
    await prisma.viaje.delete({
      where: { id: parseInt(viajeId, 10) },
    });

    // Actualizar países visitados
    if (usuario && pais) {
      await prisma.user.update({
        where: { usuario: usuario },
        data: {
          paisesVisitados: {
            set: (viaje.usuario.paisesVisitados || []).filter((p) => p !== pais),
          },
        },
      });
    }

    res.status(200).json({ message: "Viaje y país eliminados correctamente" });
  } catch (error) {
    console.error(
      "Error al eliminar el viaje y actualizar los países visitados:",
      {
        error: error.message,
        stack: error.stack,
        viajeId,
      }
    );
    res.status(500).json({ error: "Hubo un error al procesar la solicitud" });
  }
});

//! METODOS PAISES
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
    const paises = await Agarrar_paises_api(); // Función que obtiene datos de la API

    for (const country of paises) {
      const nombre = country.name.common; // Asegúrate de que estás accediendo al nombre correctamente
      const capital = country.capital ? country.capital[0] : null;
      const idiomas = country.languages ? Object.values(country.languages) : []; // Asegúrate de que sea un array
      const moneda = country.currencies
        ? Object.keys(country.currencies).join(", ")
        : null;
      const continente = country.region;

      await prisma.pais.upsert({
        where: { nombre },
        update: {
          capital,
          idiomas, // Asegúrate de que sea un array
          moneda,
          continente,
        },
        create: {
          nombre,
          capital,
          idiomas, // Asegúrate de que sea un array
          moneda,
          continente,
        },
      });
    }

    console.log("Todos los países han sido guardados o actualizados.");
  } catch (error) {
    console.error("Error guardando países en la base de datos:", error);
  }
}
// llamada para guardar los países en la base de datos
Guardar_paisesDB();

// Ruta para obtener todos los países
app.get("/api/v1/paises", async (req, res) => {
  try {
    const paises = await prisma.pais.findMany({
      orderBy: { nombre: "asc" },
      take: 300,
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

//Ruta para buscar un pais por nombre
app.get("/api/v1/paises/:nombre", async (req, res) => {
  const { nombre } = req.params;

  try {
    // Buscar país por nombre
    const pais = await prisma.pais.findUnique({
      where: { nombre },
    });

    if (!pais) {
      console.error("País no encontrado: ", nombre);
      return res.redirect("error.html?code=404&mensaje=País no encontrado");
    }

    res.status(200).json(pais);
  } catch (error) {
    console.error("Error al obtener el país: ", error);
    return res.status(500).json({ error: "Error interno al obtener el país" });
  }
});

// Ruta para crear un nuevo país
app.post("/api/v1/paises", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    const { nombre, capital, idiomas, moneda, continente } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !capital || !idiomas || !moneda || !continente) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const nuevoPais = await prisma.pais.create({
      data: {
        nombre,
        capital,
        idiomas,
        moneda,
        continente,
      },
    });

    res.status(201).json(nuevoPais);
  } catch (error) {
    console.error("Error al crear el país: ", error);
    res.status(500).json({
      error: "Error interno al crear el país",
      detalles: error.message,
    });
  }
});

// Ruta para editar un país existente
app.put("/api/v1/paises/:paisNombre", async (req, res) => {
  const { paisNombre } = req.params;
  const { nombre, capital, continente, moneda, idiomas } = req.body;

  try {
    // Buscar el país por su nombre
    const pais = await prisma.pais.findUnique({
      where: { nombre: paisNombre },
    });

    if (!pais) {
      console.error("País no encontrado");
      return res.status(404).json({ error: "País no encontrado" });
    }

    // Validar que todos los campos necesarios estén presentes
    if (!nombre || !capital || !continente || !moneda || !idiomas) {
      console.error("Todos los campos son obligatorios");
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Actualizar el país en la base de datos
    const updatedPais = await prisma.pais.update({
      where: { nombre: paisNombre },
      data: {
        nombre,
        capital,
        continente,
        moneda,
        idiomas,
      },
    });

    // Enviar la respuesta con el país actualizado
    res.json(updatedPais);
  } catch (error) {
    console.error("Error al actualizar el país:", error);
    res.status(500).json({ error: "Error al actualizar el país" });
  }
});

// Ruta para borrar un país existente
app.delete("/api/v1/paises/:id", async (req, res) => {
  const { id } = req.params;
  console.log("ID recibido en el servidor:", id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "El ID debe ser un número válido." });
  }

  try {
    const transaction = await prisma.$transaction([
      prisma.viaje.deleteMany({
        where: { paisId: parseInt(id) }, // Eliminar viajes que hacen referencia al país
      }),
      prisma.pais.delete({
        where: { id: parseInt(id) }, // Eliminar el país
      }),
    ]);

    res
      .status(200)
      .json({ message: `País y sus viajes eliminados exitosamente.` });
  } catch (error) {
    console.error("Error al eliminar el país y sus viajes:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "País no encontrado." });
    }
    res.status(500).json({ error: "Hubo un problema al eliminar el país." });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
