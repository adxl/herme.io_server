require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())
app.use(require('./auth'))


app.get('/', (req, res) => {
    res.send('ok')
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(port))