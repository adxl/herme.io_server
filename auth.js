require('dotenv').config()

const express = require('express')
const router = express.Router()

const client = require('./db.js');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


router.use(express.json())

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const query = `SELECT * FROM usrs WHERE username='${username}'`
    client.query(query, async (err, result) => {
        if (result.rows.length > 0) {
            try {
                if (await bcrypt.compare(password, result.rows[0].password)) {
                    const token = jwt.sign(username, process.env.TOKEN)
                    res.status(200).json({ token: token })
                }
                else
                    res.send("bad credentials")
            } catch (err) {
                console.log(err);
                res.status(500).send()
            }
        }
        res.status(404).send()
    })
})

const authenticateToken = function (req, res, next) {
    const token = req.headers['authorization']

    if (token == null) res.status(401).send()

    jwt.verify(token, process.env.TOKEN, (err, username) => {
        if (err) res.status(403).send()
        req.username = username
        next()
    })
}

module.exports = {
    router: router,
    authToken: authenticateToken
}