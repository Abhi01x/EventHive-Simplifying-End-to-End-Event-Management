import express from 'express';
import { register, login, getuserdata, verifyOtp } from '../controllers/authController.js';
import  auth  from '../middleware/auth.js';


const authrouters = express.Router();

authrouters.post('/register', register);
authrouters.post('/login', login);
// authrouters.post('/verify', verify )
authrouters.post('/verify-otp', verifyOtp )

authrouters.get('/me',auth(), getuserdata);

export default authrouters; 
 

