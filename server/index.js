import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import auth from './routes/auth.js';
import initSchema from './config/db/schema.js';
import userwork from './routes/user.js';
import organizerwork from './routes/organizer.js';
import connectCloudinary from './utils/cloudinary.js';

const app = express();

  
app.use(cors());

app.use(express.json());



initSchema()



app.get('/',(req,res)=>{
    res.send("API Working")
})

// for user 
app.use('/api/auth', auth);
app.use('/api/user', userwork );

// for organizer
app.use('/api/organizer', organizerwork );

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`)); 