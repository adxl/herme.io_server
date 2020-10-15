require('dotenv').config()

const express = require('express')
const app = express()

const client = require('./db.js');
const bcrypt = require('bcrypt')
const auth = require('./auth.js')
const escape = require('pg-escape');
const cors = require('cors');
app.use(cors())

app.use(auth.router)
app.use(express.json())

app.get('/dash', auth.authToken, (req, res) => {
    const query = `SELECT * FROM usrs WHERE username='${req.username}'`
    client.query(query, (err, result) => {
        if (err) throw err;
        if (!result.rows.length) {
            res.status(404).send()
            return
        }
        let data = result.rows[0]
        delete data.password
        res.status(200).json(data)
    })
})

app.get('/users/:id', auth.authToken, async (req, res) => {
    const username = req.username
    const userId = req.params.id

    let userExists = await dataExist('usrs', 'username', userId)

    if (!userExists) {
        res.status(404).send()
        return
    }

    const getUserQuery = `SELECT * FROM usrs WHERE username='${userId}'`
    let userData = new Promise((resolve, reject) => {
        client.query(getUserQuery, (err, result) => {
            if (err) throw err;
            if (!result.rows.length) {
                res.status(404).send()
                return
            }
            let data = result.rows[0]
            delete data.password
            delete data.email
            resolve(data)
        })
    })

    let user = {
        userData: await userData,
        isFriend: await dataPairExists('friends', 'usr', username, 'friend', userId),
        isRequested: await dataPairExists('friend_requests', 'usr', username, 'friend', userId),
        isInvited: await dataPairExists('friend_requests', 'usr', userId, 'friend', username),
        me: username === userId
    }

    res.status(200).json(user)
})

app.get('/posts', auth.authToken, (req, res) => {
    const query = `SELECT * FROM posts WHERE author='${req.username}'`
    client.query(query, (err, result) => {
        if (err) throw err;
        res.status(200).json(result.rows)
    })
})

app.get('/posts/friends', auth.authToken, (req, res) => {
    const username = req.username
    const getFriendsQuery = `SELECT friend FROM friends WHERE usr='${username}'`
    const getPostsQuery = `SELECT * FROM posts WHERE author IN (${getFriendsQuery})`

    client.query(getPostsQuery, (err, result) => {
        if (err) {
            throw err
        }
        res.status(200).json(result.rows)
    })
})

app.post('/posts', auth.authToken, async (req, res) => {
    let id, idExists;
    do {
        id = Math.floor(Math.random() * (9999 - 1000) + 1000)
        idExists = await dataExist('posts', 'id_post', id)
    } while (idExists);

    const post = {
        author: req.username,
        id: id,
        content: req.body.content,
        likes: 0
    }

    const addNewPostQuery = escape(`INSERT INTO posts(id_post,content,likes_count,author) VALUES ('${post.id}', %L ,'${post.likes}','${post.author}')`, post.content);
    client.query(addNewPostQuery, (err, result) => {
        if (err) throw err;
        res.status(201).send()
    })
})

app.delete('/posts', auth.authToken, async (req, res) => {
    const id = req.body.id

    let postExists = await dataExist('posts', 'id_post', id)

    if (!postExists) {
        res.status(404).send()
        return
    }

    const deletePostQuery = `DELETE FROM posts WHERE id_post='${id}'`
    client.query(deletePostQuery, (err, result) => {
        if (err) throw err;
        res.status(200).send()
    })
})

app.post('/posts/like', auth.authToken, async (req, res) => {
    const username = req.username
    const postId = req.body.postId

    const postExists = await dataExist('posts', 'id_post', postId)

    if (!postExists) {
        return res.status(404).send()
    }

    const alreadyLiked = await dataPairExists('likes', 'usr', username, 'post', postId)

    if (!alreadyLiked) {
        const likePostQuery = `UPDATE posts SET likes_count = likes_count + 1 
        WHERE id_post='${postId}'`
        const userVoteQuery = `INSERT INTO likes(usr,post) VALUES('${username}','${postId}')`

        client.query(likePostQuery, (err, result) => {
            if (err) throw err;
        })

        client.query(userVoteQuery, (err, result) => {
            if (err) throw err;
            return res.status(200).send()
        })

    } else {  // if user already liked the post

        const unlikePostQuery = `UPDATE posts SET likes_count = likes_count - 1 
        WHERE id_post='${postId}'`
        const userUnvoteQuery = `DELETE FROM likes WHERE usr='${username}' AND post='${postId}'`

        client.query(unlikePostQuery, (err, result) => {
            if (err) throw err;

        })

        client.query(userUnvoteQuery, (err, result) => {
            if (err) throw err;
            return res.status(200).send()
        })
    }
})

app.get('/friends', auth.authToken, async (req, res) => {
    const username = req.username
    const friendsQuery = `SELECT friend FROM friends where usr='${username}'`

    let friends = new Promise((resolve, reject) => {
        client.query(friendsQuery, (err, results) => {
            if (err) throw err;
            resolve(results.rows)
        })
    });

    friends = await friends

    if (!friends.length) {
        res.status(200).json({ friends: [] })
        return
    }

    let queryInValues = '(';
    friends.forEach(f => {
        queryInValues += `'${f.friend}',`
    });
    queryInValues = queryInValues.slice(0, -1);

    const getFriendsQuery = `SELECT username,first_name,last_name FROM usrs WHERE username IN ${queryInValues})`
    client.query(getFriendsQuery, (err, results) => {
        if (err) throw err;
        res.status(200).json(results.rows)
    })
})

app.get('/friends/find', auth.authToken, async (req, res) => {
    const username = req.username

    const getFriendsQuery = `SELECT friend FROM friends WHERE usr='${username}'`
    const getRequestsQuery = `SELECT friend FROM friend_requests WHERE usr='${username}'`
    const getInvitesQuery = `SELECT usr FROM friend_requests WHERE friend='${username}'`

    const getNotFriendsQuery = `SELECT username,first_name,last_name 
    FROM usrs
    WHERE username NOT IN (${getFriendsQuery}) 
    AND username NOT IN (${getRequestsQuery}) 
    AND username NOT IN (${getInvitesQuery}) 
    AND username!='${username}'`

    client.query(getNotFriendsQuery, (err, results) => {
        if (err) throw err;
        const arr = getThreeFriends(results.rows)
        res.status(200).json(arr)
    })

})

app.post('/friends/remove', auth.authToken, async (req, res) => {
    const username = req.username
    const friendToRemove = req.body.friend

    let friendExists = await dataExist('usrs', 'username', friendToRemove)
    if (!friendExists) {
        res.status(404).send()
        return
    }

    let isFriend = await dataPairExists('friends', 'usr', username, 'friend', friendToRemove)
    if (!isFriend) {
        res.status(400).send('not friend')
        return
    }

    const removeFriendQuery = `DELETE FROM friends
    WHERE usr='${username}' AND friend='${friendToRemove}'
    OR usr='${friendToRemove}' AND friend='${username}'`;
    client.query(removeFriendQuery, (err, result) => {
        if (err) throw err
        res.status(200).send()
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

app.post('/requests/invite', auth.authToken, async (req, res) => {
    const username = req.username
    const friend_username = req.body.friend

    if (username === friend_username) {
        res.status(400).send('Bad request')
        return
    }

    let friendExists = await dataExist('usrs', 'username', friend_username)

    if (!friendExists) {
        res.status(404).send('not found')
        return
    }

    let alreadyFriends = await dataPairExists('friends', 'usr', username, 'friend', friend_username)

    if (alreadyFriends) {
        res.status(400).send('alreadyFriends')
        return
    }

    let alreadyRequested = await dataPairExists('friend_requests', 'usr', username, 'friend', friend_username)
    let alreadyBeenInvited = await dataPairExists('friend_requests', 'usr', friend_username, 'friend', username)

    if (alreadyRequested) {
        res.status(400).send('Already requested')
        return
    }

    if (alreadyBeenInvited) {
        res.status(400).send('You have already been invited')
        return
    }

    const requestQuery = `INSERT INTO friend_requests(usr,friend)
    VALUES ('${username}','${friend_username}')`
    client.query(requestQuery, (err, result) => {
        if (err) throw err;
        res.status(201).send()
    })
})

app.post('/requests/cancel', auth.authToken, async (req, res) => {
    const username = req.username
    const friendToCancel = req.body.friend

    if (username === friendToCancel) {
        res.status(400).send()
        return
    }

    let isInviteSent = await dataPairExists('friend_requests', 'usr', username, 'friend', friendToCancel)

    if (!isInviteSent) {
        res.status(400).send()
        return
    }

    const removeRequestQuery = `DELETE FROM friend_requests
    WHERE usr='${username}' AND friend='${friendToCancel}'`
    client.query(removeRequestQuery, (err, result) => {
        if (err) throw err;
        res.status(200).send()
    })
})

app.post('/requests/accept', auth.authToken, async (req, res) => {
    const username = req.username
    const friendToAccept = req.body.friend

    if (username === friendToAccept) {
        res.status(400).send()
        return
    }

    let isUserInvited = await dataPairExists('friend_requests', 'usr', friendToAccept, 'friend', username)

    if (!isUserInvited) {
        res.status(400).send()
        return
    }

    const addFriendQuery = `INSERT INTO friends (usr,friend)
    VALUES ('${username}','${friendToAccept}'), ('${friendToAccept}','${username}')`
    client.query(addFriendQuery, (err, result) => {
        if (err) throw err;
    })

    const removeRequestQuery = `DELETE FROM friend_requests
    WHERE usr='${friendToAccept}' AND friend='${username}'`
    client.query(removeRequestQuery, (err, result) => {
        if (err) throw err;
        res.status(200).send()
    })
})

app.post('/requests/deny', auth.authToken, async (req, res) => {
    const username = req.username
    const friendToRefuse = req.body.friend

    if (username === friendToRefuse) {
        res.status(400).send()
        return
    }

    let isUserInvited = await dataPairExists('friend_requests', 'usr', friendToRefuse, 'friend', username)

    if (!isUserInvited) {
        res.status(400).send()
        return
    }

    const removeRequestQuery = `DELETE FROM friend_requests
    WHERE usr='${friendToRefuse}' AND friend='${username}'`
    client.query(removeRequestQuery, (err, result) => {
        if (err) throw err;
        res.status(200).send()
    })
})

app.post('/register', async (req, res) => {
    const user =
    {
        username: req.body.username.toLowerCase(),
        email: req.body.email.toLowerCase(),
        firstName: upperCaseFirst(req.body.firstName),
        lastName: upperCaseFirst(req.body.lastName),
        password: await bcrypt.hash(req.body.password, 10)
    }
    const query = `INSERT INTO usrs(username,email,first_name,last_name,password) VALUES('${user.username}','${user.email}','${user.firstName}','${user.lastName}','${user.password}')`
    client.query(query, (err, results) => {
        if (err) throw err;
        res.status(201).send()
    })
})

async function dataExist(table, column, value) {
    const query = `SELECT * FROM ${table} WHERE ${column}='${value}'`
    let exists = new Promise((resolve, reject) => {
        client.query(query, (err, res) => {
            if (err) throw err
            if (!res.rows.length)
                resolve(false)
            resolve(true)
        })
    })
    exists = await exists
    return exists
}

async function dataPairExists(table, column_1, value_1, column_2, value_2) {
    const query = `SELECT * FROM ${table} WHERE ${column_1}='${value_1}' AND ${column_2}='${value_2}'`

    console.log(query);
    let exists = new Promise((resolve, reject) => {
        client.query(query, (err, res) => {
            if (err) throw err
            if (!res.rows.length)
                resolve(false)
            resolve(true)
        })
    })
    exists = await exists
    return exists
}

upperCaseFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

getThreeFriends = (friends) => {
    if (friends.length <= 3) {
        return friends
    }

    friends.sort(() => Math.random() - 0.5);

    let arr = []
    for (let i = 0; i < 3; i++) {
        arr.push(friends[i])
    }

    return arr;
}

/*   DANGER   ZONE    */

app.get('/getall', (req, res) => {
    const query = "SELECT * FROM usrs"
    client.query(query, (err, result) => {
        if (err) throw err;
        console.log('fetch');
        res.status(200).json(result.rows)
    })
})

app.delete('/usergenocide', (req, res) => {
    const query = "DELETE FROM friend_requests"
    client.query(query, (err, result) => {
        if (err) throw err
        console.log(result);
        res.status(200).json(result)
    })
})

app.delete('/postsgenocide', (req, res) => {
    const query = "DELETE FROM posts"
    client.query(query, (err, result) => {
        if (err) throw err
        res.status(200).send("deleted all posts")
    })
})

const port = process.env.PORT || 4000;
console.clear()


app.listen(port, () => console.log(port))