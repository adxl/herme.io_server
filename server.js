require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())
app.use(require('./auth'))


const { Client } = require('pg')

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hermedb',
    password: 'password',
})
client.connect()
client.query('SELECT NOW()', (err, res) => {
    console.log("OK")
    client.end()
})

app.get('/', (req, res) => {
    res.send('ok')
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(port))