import express from 'express';
import cors from 'cors';

const app = express();
app.listen(5000, ()=>{
    console.log("servidor rodando na porta 5000");
});
app.use(express.json());
app.use(cors());



