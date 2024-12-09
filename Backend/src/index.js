const { PrismaClient } = require('@prisma/client')
const express = require('express')
const app = express()
const port = 3000

const prisma = new PrismaClient()

app.use(express.json())


app.get('/', (req, res) => {
  res.send('Viajandoo...')
})

app.get('/api/v1/users', async(req, res) => {
  const users = await prisma.user.findMany() 
  res.json(users)
})

app.get('/api/v1/users/:usuario', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      usuario: req.params.usuario
    },
  })

  if (!user) {
    res.status(404).send('User not found')
    return
  }

  res.json(user)
})

app.get('/api/v1/users/:usuario', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      usuario: req.params.usuario
    },
    include: {
      viajes: true
    }
  })

  if (!user) {
    res.status(404).send('User not found')
    return
  }

  res.json(user.viaje)
})

app.post('/api/v1/users', async (req, res) => {
  const user = await prisma.user.create({
    data: {
      nombre: req.body.nombre,
      usuario: req.body.usuario,
      nacionalidad: req.body.nacionalidad,
      idiomas: req.body.idiomas,
      email: req.body.contacto,
      paises_visitados: req.body.paises_visitados
    }
  })
  
  res.status(201).json(user)
})

app.delete('/api/v1/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(req.params.id)
    }
  })
  
  if (user === null) {
    res.status(404).send('User not found')
    return
  }
  
  await prisma.user.delete({
    where: {
      id: parseInt(req.params.id)
    }
  })
  
  res.send(user)
})


app.put('/api/v1/users/:id', async (req, res) => {
  let user = await prisma.user.findUnique({
    where: {
      id: parseInt(req.params.id)
    }
  })

  if (user === null) {
    res.status(404).send('User not found')
    return
  }

  user = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      nombre: req.body.nombre,
      usuario: req.body.usuario,
      nacionaidad: req.body.nacionalidad,
      idiomas: req.body.idiomas,
      contacto: req.body.contacto,
      paises_visitados: req.body.paises_visitados,
    }
  })
  
  res.send(user)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//METODOS VIAJES

//Busco todos los viajes
app.get('/api/v1/viajes', async (req, res) => {
  const viajes = await prisma.viaje.findMany({
    include: {
      pais: true,
      usuario: true,  
    },
  });
  res.json(viajes);
});


app.get('/api/v1/viajes/:id', async (req, res) => {

  const viaje = await prisma.viaje.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      pais: true,
      usuario: true, 
    },
  });

  if (!viaje) {
    res.status(404).send('Viaje no encontrado');
    return;
  }
  res.json(viaje);

});


app.post('/api/v1/viajes', async (req, res) => {
  const { paisId, usuarioId, fecha_inicio, fecha_fin, ciudades, presupuesto, calificacion } = req.body;

  const pais = await prisma.pais.findUnique({ where: { id: paisId } });
  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });

  if (!pais) {
    res.status(404).send('El país especificado no existe');
    return;
  }

  if (!usuario) {
    res.status(404).send('El usuario especificado no existe');
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


app.put('/api/v1/viajes/:id', async (req, res) => {

  const viajeId = parseInt(req.params.id);
  const { paisId, usuarioId, fecha_inicio, fecha_fin, ciudades, presupuesto, calificacion } = req.body;

  const viajeExistente = await prisma.viaje.findUnique({ where: { id: viajeId } });
  if (!viajeExistente) {
    res.status(404).send('Viaje no encontrado');
    return;
  }

  if (paisId) {
    const pais = await prisma.pais.findUnique({ where: { id: paisId } });
    if (!pais) {
      res.status(404).send('El país especificado no existe');
      return;
    }
  }

  if (usuarioId) {
    const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      res.status(404).send('El usuario especificado no existe');
      return;
    }
  }

  const viajeActualizado = await prisma.viaje.update({
    where: { id: viajeId },
    data: {
      paisId: paisId || viajeExistente.paisId,
      usuarioId: usuarioId || viajeExistente.usuarioId,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : viajeExistente.fecha_inicio,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : viajeExistente.fecha_fin,
      ciudades: ciudades || viajeExistente.ciudades,
      presupuesto: presupuesto || viajeExistente.presupuesto,
      calificacion: calificacion || viajeExistente.calificacion,
    },
  });

  res.json(viajeActualizado);
});


app.delete('/api/v1/viajes/:id', async (req, res) => {

  const viajeId = parseInt(req.params.id);
  const viajeExistente = await prisma.viaje.findUnique({ where: { id: viajeId } });
  if (!viajeExistente) {
    res.status(404).send('Viaje no encontrado');
    return;
  }

  await prisma.viaje.delete({ where: { id: viajeId } });

  res.send(`Viaje con ID ${viajeId} eliminado exitosamente`);
});
