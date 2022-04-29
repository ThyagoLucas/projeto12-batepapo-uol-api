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
let db = mongoClient.db(`${process.env.DATA_BASE}`);

app.post("/participants",  async (req, res)=>{
    
    const {name}  = req.body;
    const user = {name, lastStatus:Date.now()};
    const message = createMessage(name, "Todos", "entra na sala...", "status");//{from, to, text, type}
    const schema = Joi.object({
        name: Joi.string()
        .alphanum()
        .required(),
    });

    try {
        await mongoClient.connect();

        if(schema.validate({name}).error === undefined){
            const response = await db.collection("participants").findOne({name:name});
            if(response !== null){
                res.sendStatus(409);
            }
            else{
                await db.collection("participants").insertOne(user);
                await db.collection("messages").insertOne(message);
                res.sendStatus(201);
            }
        }
        else{
            res.status(422).send("Name deve ser String não vazio");
        }
  
    } catch (error) {
        console.log("Deu problema ao logar",error)
        
    }
    finally{
        await mongoClient.close();
        
    }
});

app.get("/participants", async (req, res) => {

    try {
        await mongoClient.connect();
        const onlines =  await db.collection("participants").find().toArray();
        res.send(onlines);
        
    } catch (error) {
        console.log(error);
    }
    finally{
        await mongoClient.close();
      
    }
});

app.post("/messages", async(req, res)=>{

    const {to, text, type} = req.body;
    const{user} = req.headers;
    const schema = Joi.object({
        findUser: Joi.object()
        .required(),

        to: Joi.string()
        .required(),

        text: Joi.string()
        .required(),

        type: Joi.string().equal("message", "private_message"),

    });

    try {
        await mongoClient.connect();
        const findUser = await db.collection("participants").findOne({name:user});

        if(schema.validate({to, text, type,findUser}).error === undefined){
            const message = createMessage(user, to, text, type); //{from, to, text, type};
            await db.collection("messages").insertOne(message);
            res.sendStatus(201);
        }
        else{
            res.sendStatus(422);
            console.log(schema.validate({to, text, type,findUser}).error)
        }
     
    } catch (error) {
        console.log(error);
        
    }
    finally{
        await mongoClient.close()
    }
});

app.get("/messages", async(req, res)=>{

    const limit = parseInt(req.query.limit);
    console.log(!limit);

    try {
        await mongoClient.connect();

        if(!limit){
            
        }else{
            const messages = await db.collection("messages").find({}).toArray();
            console.log(messages);
            res.send(messages);

        }
        
    } catch (error) {
        console.log(error);
        
    }
    



})


function createMessage(from, to, text, type){

    const hour = dayjs().format("HH:mm:ss");
    const message = {from:from, to:to, text:text, type:type, time: hour};

    return message;
}






