import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import Joi from 'joi';
import dotenv from 'dotenv';
import dayjs from 'dayjs';


const app = express();
app.listen(5000, ()=>{
    console.log("servidor rodando na porta 5000");
});

app.use(express.json());
app.use(cors());
dotenv.config()

const mongoClient = new MongoClient(process.env.MONGO_URL);
let db;

mongoClient.connect().then(() =>{
    db = mongoClient.db("uol_thyago");
    console.log("conectou ao bd");
}).catch(e => {
    console.log("problema ao conectar a db", e);
})




app.post("/participants",  (req, res)=>{
    
    const hour = dayjs().format("HH:mm:ss")
    console.log(hour);
    const {name}  = req.body;
    const user = {name, lastStatus:Date.now()}
    const message = {from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: hour};

    const schema = Joi.object({
        name: Joi.string()
        .alphanum()
        .required(),
    });
    
    if(schema.validate({name}).error === undefined){

        db.collection("participants").findOne({name:name}).then((response)=>{
            if(response.name!== null){
                res.sendStatus(409);
            } 
        }).catch(()=>{
            db.collection("participants").insertOne(user);
            db.collection("messages").insertOne(message);
            res.sendStatus(201);
            
        })

        
    }else{

        res.status(422).send("Name deve ser String não vazio");
    }
})

app.get("/participants", (req, res) => {

    const onlines = db.collection("participants").find().toArray().then((response)=>{
        res.send(response);
    })
});






