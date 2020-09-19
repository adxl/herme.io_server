require('dotenv').config()

const express = require('express')
const router = express.Router()

const client = require('./db.js');
const bcrypt = require('bcrypt')


router.use(express.json())

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const query = `SELECT * FROM usrs WHERE username='${username}'`
    client.query(query, async (err, result) => {
        if (result.rows.length > 0) {
            try {
                if (await bcrypt.compare(password, result.rows[0].password))
                    res.status(200).send('ok')
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


module.exports = router