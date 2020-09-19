require('dotenv').config()

const express = require('express')
const app = express()

const client = require('./db.js');
const bcrypt = require('bcrypt')

app.use(express.json())
app.use(require('./auth'))

// const { Client } = require('pg')

// const client = new Client({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'hermedb',
//     password: 'password',
// })

// client.connect()
// client.query('SELECT NOW()', (err, res) => {
//     console.log("OK")
//     client.end()
// })

app.get('/', (req, res) => {
    const query = "SELECT * FROM usrs"
    client.query(query, (err, result) => {
        if (err) throw err;
        console.log('fetch');
        res.status(200).json(result.rows)
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