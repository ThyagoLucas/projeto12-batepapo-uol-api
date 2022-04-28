import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import Joi from 'joi';
import dotenv from 'dotenv';


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
    
    const {name}  = req.body;
    const user = {name, lastStatus:Date.now()}

    const schema = Joi.object({
        name: Joi.string()
        .alphanum()
        .required(),
    });
    
    schema.validate({name}).error === undefined 
    ?   db.collection("participants").insertOne(user).then(()=>{ res.sendStatus(201)})
    :   res.status(422).send("Name deve ser String não vazio");


  
})



