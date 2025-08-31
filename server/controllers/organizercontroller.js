
import {v2 as cloudinary} from "cloudinary"
import db from "../config/db/db.js";
import { uploadToCloudinary } from "../utils/uploadBuffer.js";

export const getcategories = async (req, res) => {
   try {
    const [rows] = await db.query(`SELECT _id AS id, name FROM category`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};


export const getevent = async (req, res) => {
    try {
        const [events] = await db.query(`
            SELECT 
                events.event_id,
                events.title,
                events.location,
                events.event_date,
                events.status,
                events.image_url,  
                category.name AS category_name
            FROM 
                events
            JOIN 
                category ON events.category_id = category._id
            ORDER BY events.event_date DESC
            LIMIT 10;
            `);

       console.log('Events fetched:', events);
            
      return  res.json(events);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

export const geteventbycategory = async (req, res) => {
    const {categoryId} = req.params;
    try {
        const [rows] = await db.query(`
            SELECT 
                events.event_id,
                events.title,
                events.location,
                events.event_date,
                events.status,
                events.image_url,  
                category.name AS category_name
            FROM 
                events
            JOIN 
                category ON events.category_id = category._id
            WHERE category_id = ? lIMIT 10;
            `, [categoryId]);
         console.log('Events fetched:', rows);
            if (rows.length === 0) {
                return res.status(404).json({ msg: 'No events found for this category' });
            }
      return  res.json(rows);   
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
}





export const geteventbysearch = async (req, res) => {
   const serchquery = req.query.serchquery?.trim();  
  const date = req.query.date?.trim();              
  console.log('Search query:', serchquery);
  console.log('Date:', date);

 try {
   let sql = `
      SELECT 
        events.event_id,
        events.title,
        events.location,
        events.event_date,
        events.status,
        events.image_url,
        category.name AS category_name
      FROM 
        events
      JOIN 
        category ON events.category_id = category._id
      WHERE 1 = 1
    `;

    const params = [];

    if (serchquery) {
      sql += ` AND (LOWER(events.title) LIKE LOWER(?) OR LOWER(events.location) LIKE LOWER(?))`;
      params.push(`%${serchquery}%`, `%${serchquery}%`);
    }

    if (date) {
        console.log('fdfd');
      sql += ` AND DATE(events.event_date) = ?`;
      params.push(date); // example: '2025-09-01'
    }

    sql += ` LIMIT 10`;

    const [rows] = await db.query(sql, params);

       console.log('Events fetched:', rows);
            if (rows.length === 0) {
                return res.status(404).json({ msg: 'No events found for this category' });
            }
      return  res.json(rows);   
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


export const geteventbyid = async (req, res) => {
    const {id} = req.params;    

    try {

        // console.log('User ID from token:', req.user.id);        
        
         const [rows] = await db.query(`
              SELECT 
                events.event_id, events.title, events.description,
                events.location,events.address, events.event_date, events.status,
                events.start_time, events.end_time,
                events.created_at,
                users.name AS organizer_name, users.email AS organizer_email,
                category.name AS category_name
               FROM events
              JOIN users ON events.organizer_id = users.id
              JOIN category ON events.category_id = category._id
              WHERE events.event_id = ? AND  lIMIT 1;
            `, [id]);


        console.log('Event fetched:', rows[0]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Event not found' });
        }   
        return res.json(rows[0]);   
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
}



export const createEventWithTickets = async (req, res) => {
  const {
    title, description, location, address,
    event_date, start_time, end_time,
    category_id, status,
  } = req.body;
  
  let tickets = [
  {
    "ticket_type": "General",
    "price": 99.99,
    "start_date": "2025-09-01",
    "end_date": "2025-11-15",
    "total_available": 300,
    "max_per_user": 4
  },
  {
    "ticket_type": "VIP",
    "price": 249.99,
    "start_date": "2025-09-01",
    "end_date": "2025-11-15",
    "total_available": 50,
    "max_per_user": 2
  }
]
;

   console.log('Tickets data:', tickets);

  const organizer_id = req.user.id;

   if (!req.file) {
      return res.status(400).json({ msg: "Image file is required" });
    }
   
    
     
    const image_url = await uploadToCloudinary(req.file.buffer);
    console.log('Uploaded image URL:', image_url);
 
  if (
    !title || !event_date || !category_id || !status || !image_url ||
    !address || !location || !start_time || !end_time || !description ||
    !tickets  || tickets.length === 0
  ) {
    return res.status(400).json({ msg: 'All event and ticket fields are required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();


    const [eventResult] = await connection.query(`
      INSERT INTO events (organizer_id, category_id, title, description, location, address, event_date, start_time, end_time, status, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      organizer_id, category_id, title, description, location,
      address, event_date, start_time, end_time, status, image_url
    ]);

    const event_id = eventResult.insertId;



    for (const ticket of tickets) {
  const {
    ticket_type,
    price,
    start_date,
    end_date,
    total_available,
    max_per_user
  } = ticket;

  await connection.query(`
    INSERT INTO tickets (
      event_id,
      name,
      price,
      sales_start,
      sales_end,
      total_quantity,
      quantityper_user
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    event_id,
    ticket_type,
    price,
    start_date,
    end_date,
    total_available,
    max_per_user || 1 // Default to 1 if not provided
  ]);
}

    await connection.commit();
    res.status(201).json({ msg: 'Event and tickets created', event_id });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  } finally {
    connection.release();
  }

};
