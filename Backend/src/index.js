const { PrismaClient } = require ('@prisma/client')
const express = require('express')
const app = express()
const port = 3000

const prisma = new PrismaClient()

app.use(express.json())


app.get('/', (req, res) => {
  res.send('Viajandoo...')
})

app.get('/api/v1/users', async(req, res) => {
  const users = await prisma.findMany() 
  res.json(users)
})

app.get('/api/v1/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(req.params.id)
    }
  })

  if (user === null) {
    res.status(404).send('User not found')
    return
  }

  res.json(user)
})

app.post('/api/v1/users', async (req, res) => {
  const user = await prisma.user.create({
    data: {
      nombre: req.body.nombre,
      nacionalidad: req.body.nacionalidad,
      idiomas: req.body.idiomas,
      contacto: req.body.contacto,
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
      id: parseInt (req.params.id)
    }
  })
  
  res.send(user)
})


app.put('/api/v1/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
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
