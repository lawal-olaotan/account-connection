import express  from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import morgan  from 'morgan'
import institutions from './routes/institutions.js'
import link from './routes/link.js'
import update from './routes/update.js';
import dotenv from "dotenv"
import { setupMobileSocket } from './controllers/mobile-socket.js';
import http from 'http'



import { dbPromise } from './db/config.js';
dotenv.config(); 

// initiate express
const app = express();
const server = http.createServer(app)
const PORT = process.env.PORT

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(cors({origin:'*'})); 


// set websocket
setupMobileSocket(server)

app.use((req,res,next)=>{
    next();
}); 


app.use('/institutions', institutions)
app.use('/link', link)
app.use('/update', update)

server.listen(PORT, async()=>{
    try{
        await dbPromise
        console.log("Db is connected");
    }catch(error){
        if (error) console.log(error);
    }
})