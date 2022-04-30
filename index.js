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
mongoClient.connect();

app.post("/participants",  async (req, res)=>{
    
    const {name}  = req.body;
    const user = {name, lastStatus:Date.now()};
    const message = createMessage(name, "Todos", "entra na sala...", "status");//{from, to, text, type}
    const schema = Joi.object({
        name: Joi.string()
        .required(),
    });

    if(schema.validate({name}).error !== undefined){
        console.log('entrou no if  validate');
        return res.status(422).send("Name deve ser String não vazio");
    }

    try {
        
        const response = await db.collection("participants").findOne({name:name}); //verifica match com usuários logados
        
        if(response === null){
            await db.collection("participants").insertOne(user);
            await db.collection("messages").insertOne(message);
            res.sendStatus(201);
        }
        else{
            res.sendStatus(409);
        }
    } catch (error) {
        console.log("Deu problema ao logar",error)
        
    }
    
}); //ok

app.get("/participants", async (req, res) => {

    try {

        const onlines =  await db.collection("participants").find().toArray();
        res.send(onlines);
        
    } catch (error) {
        console.log(error);
    }
   
});//ok

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

    const findUser = await db.collection("participants").findOne({name:user}); // consulta se o user está logado;

    if(schema.validate({to, text, type,findUser}).error !== undefined){ //verifica inputs;

        console.log(schema.validate({to, text, type,findUser}).error);
        return res.sendStatus(422);
    };

    try {
        const message = createMessage(user, to, text, type); //{from, to, text, type};
        await db.collection("messages").insertOne(message); // cadastra msgs;
        res.sendStatus(201);

    } catch (error) {
        console.log(error);
        
    }
}); //ok

app.get("/messages", async(req, res)=>{

    const limit = req.query.limit;
    const{ user } = req.headers; 

    try {
        if(limit!==undefined){
            const messages = await db.collection("messages").find({$or:[{from:`${user}`},{to:"Todos"}, {to:`${user}`}, {type:'message'}]}).toArray();
            const lastMsg = messages.slice(-(parseInt(limit))); 
            res.send(lastMsg); 
        }else{
            const messages = await db.collection("messages").find({$or:[{from:`${user}`},{to:"Todos"}, {to:`${user}`}, {type:'message'}]}).toArray();
            res.send(messages);
        }
        
    } catch (error) {
        console.log("Errooooooooo, corre aqui!",error); 
    }
});//ok

app.post("/status", async (req, res)=>{

    const { user } = req.headers;   

    try {
        //trabalhar aqui

        const findUser = await db.collection("participants").findOneAndUpdate({name:user});
       

        if(findUser === null){
            res.sendStatus(404); 
        }
        else{
            res.sendStatus(200);
        }

       
        
    } catch (error) {
        
    }


});


setInterval(()=>{
    const date = Date.now();
    

}, 10000)


function createMessage(from, to, text, type){

    const hour = dayjs().format("HH:mm:ss");
    const message = {from:from, to:to, text:text, type:type, time: hour};

    return message;
};

