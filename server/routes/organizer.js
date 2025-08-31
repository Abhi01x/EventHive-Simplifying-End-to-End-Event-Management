import express from "express";
import authw from "../middleware/authw.js";
import {upload} from "../utils/multer.js";
import { getevent, geteventbyid, getcategories, geteventbycategory, geteventbysearch  ,createEventWithTickets} from "../controllers/organizercontroller.js";

const routers = express.Router();


routers.get('/get-categories', authw(['organizer']),getcategories)
routers.get('/get-event',authw(['organizer']) , getevent);
routers.get('/get-event/:id',authw(['organizer']), geteventbyid);
routers.get('/categories/:categoryId',authw(['organizer']), geteventbycategory);
routers.get('/get-event-bysearch',authw(['organizer']), geteventbysearch);
routers.post('/create-event', authw(['organizer']) ,upload.single("image"), createEventWithTickets);




export default routers; 