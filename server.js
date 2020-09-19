require('dotenv').config()

const express = require('express')
const app = express()

const client = require('./db.js');
const bcrypt = require('bcrypt')
const auth = require('./auth.js')
app.use(auth.router)
// const jwt = require('jsonwebtoken')

app.use(express.json())
// app.use(require('./auth'))

app.get('/', (req, res) => {
    const query = "SELECT * FROM usrs"
    client.query(query, (err, result) => {
        if (err) throw err;
        console.log('fetch');
        res.status(200).json(result.rows)
    })
})

app.get('/dash', auth.authToken, (req, res) => {
    // console.log(req.username);
    const query = `SELECT first_name FROM usrs WHERE username='${req.username}'`
    client.query(query, (err, result) => {
        if (err) throw err;
        res.status(200).send('Hello ' + req.username)
    })
})

app.post('/register', async (req, res) => {
    const user =
    {
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: await bcrypt.hash(req.body.password, 10)
    }
    // console.log(user);
    const query = `INSERT INTO usrs(username,first_name,last_name,password) VALUES('${user.username}','${user.firstName}','${user.lastName}','${user.password}')`
    client.query(query, (err, results) => {
        if (err) throw err;
        res.status(201).send("Created")
    })
})

app.delete('/genocide', (req, res) => {
    const query = "DELETE FROM usrs"
    client.query(query, (err, result) => {
        res.status(200).send("deleted all users")
    })
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(port))