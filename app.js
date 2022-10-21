const express = require('express')
const app = express()
const config = require('./config')
const port = process.env.PORT || 3000
const mongodb = require('mongodb')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

app.use(bodyParser.json())
app.use(express.urlencoded({extended : false}));
app.use(express.static(__dirname + '/public'))

app.set('views','./public/views')
app.set('view engine','ejs')


MongoClient.connect(config.MONGODB_CONNECT_STRING, function(err, db) {
    if (err) throw err;
    const dbo = db.db("db");
    const db_article = dbo.collection("article")
    const db_todo = dbo.collection("todo")

    app.get('/',(req,res) => {
        try {
            res.render('index')
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })
    app.get('/riot.txt', (req,res) => {
        try {
            res.send('34d0928e-b590-4c76-84ba-0947c813bffe')
        } catch (e) {
            
        }
    })

    app.get('/create_article',(req,res) => {
        try {
            res.render('create_article')
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.post('/board',(req,res) => {
        try {
            const {title,nickname,body} = req.body
            const filter = {}
            if(!title) {return res.status(400).send('title 입력 필수!')}
            else{
                filter.title = title
                filter.createAt = new Date().toUTCString()
            }
            if(!nickname) {return res.status(400).send('nickname 입력 필수!')}
            else{filter.nickname = nickname}
            if(!body) {return res.status(400).send('body 입력 필수!')}
            else{filter.body = body}

            db_article.insertOne(filter,(err,result) => {
                res.redirect('/read_article')
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.get('/read_article',(req,res) => {
        try {
            db_article.find({},{projection : {}}).toArray((err,result) => {
                res.render('read_article',{result})
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })



    app.get('/read_article/:id',(req,res) => {
        try {
            const {id} = req.params
            db_article.find(mongodb.ObjectId(id),{projection : {_id:0,title:1,nickname:1,body:1,createAt:1}}).toArray((err,result)=> {
                res.render('read_article_id',{result})
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.get('/update_article/:id',(req,res) => {
        try {
            const {id} = req.params
            db_article.find({_id : mongodb.ObjectId(id)},{projection : {}}).toArray((err,result) => {
                res.render('update_article',{result, _id : id})
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.post('/update_board/:id',(req,res) => {
        try {
            const {id} = req.params
            if(id.length !== 24) res.status(400).send('Bad Request')
            const {title,nickname,body} = req.body
            const updateQuery = {}
            if((title && typeof title === 'string') || (nickname && typeof nickname === 'string') || (body && typeof body === 'string')){
                if(title) updateQuery.title = title
                if(nickname) updateQuery.nickname = nickname
                if(body) {
                    updateQuery.body = body
                    updateQuery.createAt = new Date().toUTCString()
                }
            }
            else res.status(400).send('Bad Request')
            db_article.updateOne({_id : mongodb.ObjectId(id)},{$set : updateQuery},(err,result) => {
                if(result.matchedCount < 1) res.status(404).send('Not Found')
                else res.redirect('/read_article')
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.post('/delete_article/:id',(req,res) => {
        try {
            const {id} = req.params
            if(id.length !== 24) res.status(400).send('Bad Request')
            db_article.deleteOne({_id : mongodb.ObjectId(id)},(err,result) => {
                if(result.deletedCount < 1) res.status(404).send('Not Found')
                else res.redirect('/read_article')
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

///////////////////////////TODO-LIST//////////////////////////////////////////////////////////////////////

    app.get('/todo_list', (req, res) => {
        try {
            db_todo.find({},{projection : {}}).sort({createAt : -1}).toArray((err,result) => {
                res.render('todo_list',{result})
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.post('/create_list', (req, res) => {
        try {
            const { list } = req.body
            const filter = {}
            if(!list) {return res.status(400).send('title 입력 필수!')}
            else{
                filter.list = list
                filter.createAt = new Date().toUTCString()
            }
            db_todo.insertOne(filter,(err,result) => {
                res.redirect('todo_list')
            })
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    })

    app.all('*', (req, res) => {
        res.status(404).send('Not Found')
    })

    app.listen(port, ()=> {
      console.log('server on!!')
    })
});
