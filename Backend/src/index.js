const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
require("dotenv").config();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());
app.use(
  cors({
    origin: "http://localhost:8000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
  })
);

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

//Creo un viaje
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

  const pais = await prisma.pais.findUnique({ where: { id: paisId } });
  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });

  if (!pais) {
    res.status(404).send("El país especificado no existe");
    return;
  }

  if (!usuario) {
    res.status(404).send("El usuario especificado no existe");
    return;
  }

  const nuevoViaje = await prisma.viaje.create({
    data: {
      paisId,
      usuarioId,
      fecha_inicio: new Date(fecha_inicio),
      fecha_fin: new Date(fecha_fin),
      ciudades,
      presupuesto: presupuesto || 0,
      calificacion: calificacion || 0,
    },
  });

  res.status(201).json(nuevoViaje);
});

//Actualizo un viaje
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

  const viajeExistente = await prisma.viaje.findUnique({
    where: { id: viajeId },
  });
  if (!viajeExistente) {
    res.status(404).send("Viaje no encontrado");
    return;
  }

  if (paisId) {
    const pais = await prisma.pais.findUnique({ where: { id: paisId } });
    if (!pais) {
      res.status(404).send("El país especificado no existe");
      return;
    }
  }

  if (usuarioId) {
    const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      res.status(404).send("El usuario especificado no existe");
      return;
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
});

app.delete("/api/v1/viajes/:id", async (req, res) => {
  const viajeId = parseInt(req.params.id);
  const viajeExistente = await prisma.viaje.findUnique({
    where: { id: viajeId },
  });
  if (!viajeExistente) {
    res.status(404).send("Viaje no encontrado");
    return;
  }

  await prisma.viaje.delete({ where: { id: viajeId } });

  res.send(`Viaje con ID ${viajeId} eliminado exitosamente`);
});


//METODOS PAISES

// Ruta para traer y guardar países desde la API
app.get('/api/v1/paises/fetch', async (req, res) => {
  try {
    console.log('Iniciando fetch de países...');
    const response = await fetch('https://restcountries.com/v3.1/all');
    console.log('Respuesta obtenida de la API');
    const countries = await response.json();

    // Limitar a 250 países
    const paises_limitados = countries.slice(0, 250);

    for (const pais of paises_limitados) {
      console.log(`Procesando país: ${pais.name.common}`);
      const idiomas = pais.languages ? Object.values(pais.languages) : [];
      const capital = pais.capital && pais.capital.length > 0 ? pais.capital[0] : 'Desconocida';
      const moneda = pais.currencies ? Object.keys(pais.currencies)[0] : 'Desconocida';

      await prisma.pais.create({
        data: {
          nombre: pais.name.common,
          capital: capital,
          idiomas: idiomas,
          moneda: moneda,
          continente: pais.region || 'Desconocido',
        },
      });
      console.log(`País guardado: ${pais.name.common}`);
    }

    res.status(200).json({ message: 'Países guardados exitosamente' });
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ error: 'Error al guardar los países', detalles: error.message });
  }
});



// Ruta para obtener todos los países
app.get('/api/v1/paises', async (req, res) => {
  try {
    const paises = await prisma.pais.findMany({
      include: { Viaje: true },
    });
    res.status(200).json(paises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los países' });
  }
});

// Ruta para obtener un país por ID
app.get('/api/v1/paises/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pais = await prisma.pais.findUnique({
      where: { id: parseInt(id) },
      include: { Viaje: true },
    });

    if (!pais) {
      return res.status(404).json({ error: 'País no encontrado' });
    }

    res.status(200).json(pais);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el país' });
  }
});
