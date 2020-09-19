require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())
app.use(require('./auth'))

console.log("DB");
console.log(process.env.DATABASE_URL);

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

const { Client } = require('pg');



// postgres://mihhtzqwfpbejw:577b24af9bd51732c1dbb1b2373687faa7b826a31de854daedd3feac33a4d5dd@ec2-176-34-123-50.eu-west-1.compute.amazonaws.com:5432/d7cc53nqio36s1

const client = new Client({
    connectionString: "postgres://mihhtzqwfpbejw:577b24af9bd51732c1dbb1b2373687faa7b826a31de854daedd3feac33a4d5dd@ec2-176-34-123-50.eu-west-1.compute.amazonaws.com:5432/d7cc53nqio36s1",
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

client.query('SELECT * FROM usrs;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
        console.log(JSON.stringify(row));
    }
    client.end();
});


app.get('/', (req, res) => {
    res.send('ok')
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(port))