import express, { Router } from 'express';
import multer from 'multer';
import { getevent  ,geteventbyid ,getcategories ,geteventbycategory ,geteventbysearch , getticketbyeventid ,booktickets ,getMyBookings} from '../controllers/usercontroller.js';
import  authw  from '../middleware/authw.js';
import auth from '../middleware/auth.js';
import { upload } from '../utils/multer.js';
// import authw from '../middleware/authw.js';
const uploads = multer();


const routers = express.Router();

routers.get('/get-categories', auth(),getcategories)
routers.get('/get-event',authw(['user']) , getevent);
routers.get('/get-event/:id',authw(['user']), geteventbyid);
routers.get('/categories/:categoryId',authw(['user']), geteventbycategory);
routers.get('/get-event-bysearch',authw(['user']), geteventbysearch);

routers.post('/get-tickets',authw(['user']), getticketbyeventid);
routers.post('/book-ticket', authw(['user']), uploads.none(), booktickets);
routers.get('/my-bookings',authw(['user']), getMyBookings);


export default routers;


