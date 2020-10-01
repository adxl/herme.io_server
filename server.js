require('dotenv').config()

const express = require('express')
const app = express()

const client = require('./db.js');
const bcrypt = require('bcrypt')
const auth = require('./auth.js')

const cors = require('cors')
app.use(cors())

app.use(auth.router)
// const jwt = require('jsonwebtoken')

app.use(express.json())
// app.use(require('./auth'))

// debug
app.get('/getall', (req, res) => {
    const query = "SELECT * FROM usrs"
    client.query(query, (err, result) => {
        if (err) throw err;
        console.log('fetch');
        res.status(200).json(result.rows)
    })
})

app.get('/dash', auth.authToken, (req, res) => {
    // console.log(req.username);
    const query = `SELECT * FROM usrs WHERE username='${req.username}'`
    client.query(query, (err, result) => {
        if (err) throw err;
        let data = result.rows[0]
        delete data.password
        res.status(200).json(data)
    })
})

app.get('/posts', auth.authToken, (req, res) => {
    const query = `SELECT * FROM posts WHERE author='${req.username}'`
    client.query(query, (err, result) => {
        if (err) throw err;
        res.status(200).json(result.rows)
    })
})

app.post('/posts', auth.authToken, async (req, res) => {
    const checkIdQuery = `SELECT * FROM posts WHERE id_post=`
    let id, idExists;

    do {
        id = Math.floor(Math.random() * (9999 - 1000) + 1000)
        let idExists = new Promise((resolve, reject) => {
            client.query(checkIdQuery + `'${id}'`, (err, result) => {
                if (err) throw err;
                if (!result.rows.length)
                    resolve(false)
                resolve(true)
            })
        });
        idExists = await idExists
    } while (idExists);

    const post = {
        author: req.username,
        id: id,
        title: req.body.title,
        content: req.body.content,
        likes: 0
    }

    const addNewPostQuery = `INSERT INTO posts(id_post,title,content,likes_count,author) 
    VALUES ('${post.id}','${post.title}','${post.content}','${post.likes}','${post.author}')`

    client.query(addNewPostQuery, (err, result) => {
        if (err) throw err;
        res.status(201).send()
    })
})

app.get('/friends', auth.authToken, (req, res) => {
    const username = req.username
    const query = `SELECT friend FROM friends where usr='${username}'`
    client.query(query, (err, data) => {
        if (err) throw err;
        res.status(200).json(data.rows)
    })
})

app.get('/requests', auth.authToken, (req, res) => {
    const username = req.username
    const query = `SELECT usr FROM friend_requests WHERE friend='${username}'`
    client.query(query, (err, data) => {
        if (err) throw err;
        res.status(200).json(data.rows)
    })
})

app.post('/requests/add', auth.authToken, async (req, res) => {
    const username = req.username
    const friend_username = req.body.friend

    if (username === friend_username) {
        res.status(400).send('Bad request')
        return
    }

    const checkFriendQuery = `SELECT * FROM usrs WHERE username='${friend_username}'`

    let friendExists = new Promise((resolve, reject) => {
        client.query(checkFriendQuery, (err, result) => {
            if (err) throw err;
            if (!result.rows.length)
                resolve(false)
            resolve(true)
        })
    });

    friendExists = await friendExists

    if (!friendExists) {
        res.status(404).send('not found')
        return
    }

    const requestQuery = `INSERT INTO friend_requests(usr,friend)
    VALUES ('${username}','${friend_username}')`
    client.query(requestQuery, (err, result) => {
        if (err) throw err;
        res.status(201).send()

    })
})

app.post('/requests/accept', auth.authToken, async (req, res) => {
    const username = req.username
    const friendToAccept = req.body.friend

    if (username === friendToAccept) {
        res.status(400).send()
        return
    }

    const friendExistsQuery = `SELECT usr FROM friend_requests WHERE friend='${username}' AND usr='${friendToAccept}'`
    let friendExists = new Promise((resolve, reject) => {
        client.query(friendExistsQuery, (err, result) => {
            if (err) throw err;
            if (!result.rows.length)
                resolve(false)
            resolve(true)
        })
    });

    friendExists = await friendExists

    if (!friendExists) {
        res.status(404).send()
        return
    }

    const addFriendQuery = `INSERT INTO friends (usr,friend)
    VALUES ('${username}','${friendToAccept}'), ('${friendToAccept}','${username}')`

    client.query(addFriendQuery, (err, result) => {
        if (err) throw err;
        res.status(201).send()
    })
})

app.post('/register', async (req, res) => {
    const user =
    {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: await bcrypt.hash(req.body.password, 10)
    }
    // console.log(user);
    const query = `INSERT INTO usrs(username,email,first_name,last_name,password) VALUES('${user.username}','${user.email}','${user.firstName}','${user.lastName}','${user.password}')`
    client.query(query, (err, results) => {
        if (err) throw err;
        res.status(201).send()
    })
})






/*   DANGER   ZONE    */


app.delete('/usergenocide', (req, res) => {
    const query = "DELETE FROM usrs"
    client.query(query, (err, result) => {
        res.status(200).send("deleted all users")
    })
})

app.delete('/postsgenocide', (req, res) => {
    const query = "DELETE FROM posts"
    client.query(query, (err, result) => {
        res.status(200).send("deleted all posts")
    })
})

const port = process.env.PORT || 4000;
console.clear()
app.listen(port, () => console.log(port))