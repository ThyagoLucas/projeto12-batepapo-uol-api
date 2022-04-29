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

let db = mongoClient.db(`"${process.env.DATA_BASE}"`);

app.post("/participants",  async (req, res)=>{
    
    const hour = dayjs().format("HH:mm:ss");
    const {name}  = req.body;
    const user = {name, lastStatus:Date.now()};
    const message = {from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: hour};

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
})

app.get("/participants", async (req, res) => {

    try {
        await mongoClient.connect();
        const onlines =  await db.collection("participants").find().toArray();
        res.send(onlines);
        
    } catch (error) {
        console.log(error);
    }
    finally{
        await mongoClient.close()
    }
});






