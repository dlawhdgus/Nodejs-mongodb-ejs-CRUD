const express = require('express')
const app = express()
const config = require('./config')
const port = process.env.PORT || 3000
const mongodb = require('mongodb')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

app.set('view engine','ejs')
app.set('views','./views')

app.use(bodyParser.json())
app.use(express.urlencoded({extended : false}));

MongoClient.connect(config.MONGODB_CONNECT_STRING, function(err, db) {
    if (err) throw err;
    const dbo = db.db("db");
    const db_article = dbo.collection("article")

    app.get('/',(req,res) => {
        res.render('index')
    })

    app.get('/create_article',(req,res) => {
        res.render('create_article')
    })

    app.post('/board',(req,res) => {
        const {title,nickname,body} = req.body
        const filter = {}
        if(title){
            filter.title = title
            filter.createAt = new Date().toUTCString()
        }
        if(nickname){filter.nickname = nickname}
        if(body){filter.body = body}

        db_article.insertOne(filter,(err,result) => {
            if(err) throw err
            res.redirect('/read_article')
        })
    })

    app.get('/read_article',(req,res) => {
        db_article.find({},{projection : {}}).toArray((err,result) => {
            if(err) throw err
            res.render('read_article',{result})
        })
    })

    app.get('/read_filter_article',(req,res) => {
        const {title} = req.query
        const filter = {}
        if(title){filter.title = title}
        db_article.find(filter,{projection : {_id : 0, title : 1}}).toArray((err,result) => {
            if(err) throw err
            res.render('read_article',{result})
        })
    })

    app.get('/read_article/:_id',(req,res) => {
        const {_id} = req.params
        db_article.find(mongodb.ObjectId(_id),{projection : {_id:0,title:1,nickname:1,body:1,createAt:1}}).toArray((err,result)=> {
            if(err) throw err
            res.render('read_article_id',{result})
        })
    })

    app.get('/update_article/:_id',(req,res) => {
        const {_id} = req.params
        db_article.find({_id : mongodb.ObjectId(_id)},{projection : {}}).toArray((err,result) => {
            if(err) throw err
            res.render('update_article',{result, _id : _id})
        })
    })

    app.post('/update_board/:_id',(req,res) => {
        const {_id} = req.params
        const {title,nickname,body} = req.body
        const filter = {}
        if(title){
            filter.title = title
            filter.createAt = new Date().toUTCString()
        } else {
            res.send("<script>alert('제목을 입력해 주세요.');history.back();</script>");
        }
        if(nickname){filter.nickname = nickname}
        if(body){filter.body = body}
        db_article.updateOne({_id : mongodb.ObjectId(_id)},{$set : filter},(err,result) => {
            if(err) throw err
            res.redirect('/read_article')
        })
        
    })

    app.post('/delete_article/:_id',(req,res) => {
        const {_id} = req.params
        db_article.deleteOne({_id : mongodb.ObjectId(_id)},(err,result) => {
            if(err) throw err
            res.redirect('/read_article')
        })
    })

    app.post('/delete_admin_article',(req,res) => {
        const {pw} = req.body
        console.log(pw)
        db_article.find({},{projection : {}}).toArray((err,result) => {
            if(err) throw err
            res.render('read_admin_article',{result})
        })
        
    })
});

app.listen(port, ()=> {
  console.log('server on!!')
})