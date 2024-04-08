import express  from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import morgan  from 'morgan'
import institutions from './routes/institutions.js'
import link from './routes/link.js'
import dotenv from "dotenv"
import session from 'express-session';
import { randomUUID } from "crypto";
import MongoStore from 'connect-mongo';



import { dbPromise } from './db/config.js';
dotenv.config(); 

// initiate express
const app = express();
const PORT = process.env.PORT
    
// TODO: currently not utilised, need to use session might arise in the future
// app.use(session({
//     secret: randomUUID(),
//     resave: false,
//     saveUninitialized: false,
//     store: new MongoStore({
//         client: dbPromise,
//         collection:'linkSession',
//         ttl: 60 * 60,
//     }),
//     cookie: {
//         secure: 'auto',
//         maxAge: 24 * 60 * 60 * 1000
//     }
// }));


app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(cors({origin:'*'})); 



app.use((req,res,next)=>{
    next();
}); 


app.use('/institutions', institutions)
app.use('/link', link)

// app.use('/message', handleMessagesapp.use('/schedule', scheduleReminder ))

app.listen(PORT, async()=>{
    console.log(`Server is running on port ${PORT}`);
    try{
        await dbPromise
        console.log("Db is connected");
    }catch(error){
        if (error) error;
    }
})