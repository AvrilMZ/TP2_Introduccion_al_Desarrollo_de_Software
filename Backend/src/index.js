const express = require('express')
const app = express()
const port = 3000


users=[{
  id:1,
  Nombre:"Juan",
  Nacionalidad:"Mexicana",
  Idiomas:["Español","Ingles"],
  Contacto: "juan@gmail.com",
  paises_visitados:["Mexico","USA","Canada"],
}]

app.use(express.json())


app.get('/', (req, res) => {
  res.send('Viajandoo...')
})

app.get('/api/v1/users', (req, res) => {
  res.json(users)
})

app.get('/api/v1/users/:id', (req, res) => {
  const id = req.params.id
  const user = users.find(user => user.id == id)

  if (!user) {
    res.status(404).send('User not found')
    return
  }

  res.json(user)
})

app.post('/api/v1/users', (req, res) => {
  user = {
    id: users.length + 1,
    Nombre: req.body.Nombre,
    Nacionalidad: req.body.Nacionalidad,
    Idiomas: req.body.Idiomas,
    Contacto: req.body.Contacto,
    paises_visitados: req.body.paises_visitados
  }
  users.push(user)
  res.status(201).json(user)
})

app.delete('/api/v1/users/:id', (req, res) => {
  const existe =!(users.find((elemento) => elemento.id == req.params.id))
  if (!existe) {
    res.status(404).send('User not found')
    return
  }
  users= users.filter((elemento) => elemento.id != req.params.id)
  res.status(204).send()
})


app.put('/api/v1/users/:id', (req, res) => {
  const user_index = users.find_index(user => user.id == req.params.id)
  if (user_index===-1) {
    res.status(404).send('User not found')
    return
  }
  users[user_index].Nombre = req.body.Nombre ?? users[user_index].Nombre
  users[user_index].Nacionalidad = req.body.Nacionalidad ?? users[user_index].Nacionalidad
  users[user_index].Idiomas = req.body.Idiomas ?? users[user_index].Idiomas
  users[user_index].Contacto = req.body.Contacto ?? users[user_index].Contacto
  users[user_index].paises_visitados = req.body.paises_visitados ?? users[user_index].paises_visitados

  res.send(users[user_index])
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
