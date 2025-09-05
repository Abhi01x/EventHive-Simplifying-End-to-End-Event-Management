
import db from "../config/db/db.js";


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

        console.log('User ID from token:');
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
                wHERE events.status = 'published'
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
            WHERE events.status = 'published' AND  category_id = ? lIMIT 10;
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
      WHERE 1 = 1 AND events.status = 'published'
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
                events.created_at,events.image_url,
                users.name AS organizer_name, users.email AS organizer_email,
                category.name AS category_name
               FROM events
              JOIN users ON events.organizer_id = users.id
              JOIN category ON events.category_id = category._id
              WHERE events.event_id = ? AND events.status = 'published' lIMIT 1;
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



export const getticketbyeventid = async (req, res) => {
    
    const {id} = req.body;

    console.log('Event ID:', id);

    try {
        const [rows] = await db.query(` 
            SELECT
                ticket_id, name, price, quantityper_user,
                total_quantity, sales_start, sales_end
            FROM
                tickets
            WHERE
                event_id = ? ;
        `, [id]);
        console.log('Tickets fetched:', rows);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'No tickets found for this event' });
        }
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
}




export const booktickets = async (req, res) => {
const { ticket_id } = req.body;
  
const attendees = req.body.attendees; // Expecting an array of attendee objects
const quantity = attendees ? attendees.length : 0;
   console.log('Attendees:', attendees , ticket_id, quantity);
  if (!ticket_id || !quantity || !attendees) {
    return res.status(400).json({ msg: 'ticket_id, quantity, and attendees are required' });
  }

  const userId = req.user.id;

  if (!Array.isArray(attendees) || attendees.length !== quantity) {
    return res.status(400).json({ msg: 'Attendees list must match the quantity of tickets' });
  }

  console.log('Booking request:', ticket_id);
  try {

    const [ticketRows] = await db.query(`
      SELECT ticket_id, event_id, price, total_quantity, sold_quantity, sales_start, sales_end, quantityper_user
      FROM tickets
      WHERE ticket_id = ? LIMIT 1;
    `, [ticket_id]);

    if (ticketRows.length === 0) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    const currentTime = new Date();

    if (currentTime < new Date(ticket.sales_start) || currentTime > new Date(ticket.sales_end)) {
      return res.status(400).json({ msg: 'Ticket sales are not active' });
    }

    if (quantity > ticket.quantityper_user) {
      return res.status(400).json({ msg: `Cannot book more than ${ticket.quantityper_user} tickets per user` });
    }

    if (ticket.sold_quantity + quantity > ticket.total_quantity) {
      return res.status(400).json({ msg: 'Not enough tickets available' });
    }

    const totalPrice = ticket.price * quantity;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
   
      await connection.query(`
        UPDATE tickets
        SET sold_quantity = sold_quantity + ?
        WHERE ticket_id = ?;
      `, [quantity, ticket_id]);


      const [bookingResult] = await connection.query(`
        INSERT INTO booked_tickets (user_id, ticket_id, quantity, total_price, payment_status)
        VALUES (?, ?, ?, ?, 'completed');
      `, [userId, ticket_id, quantity, totalPrice]);

      const bookingId = bookingResult.insertId;

  
      for (const attendee of attendees) {
        const { name, email, mobile, gender } = attendee;
        if (!name || !email || !mobile || !gender) {
          await connection.rollback();
          return res.status(400).json({ msg: 'All attendee details are required' });
        }

        await connection.query(`
          INSERT INTO attendees (booking_id, name, email, phone, gender)
          VALUES (?, ?, ?, ?, ?);
        `, [bookingId, name, email, mobile, gender]);
      }

      await connection.commit();
      res.json({ msg: 'Tickets booked successfully', bookingId, totalPrice });

    } catch (err) {
      await connection.rollback();
      console.error('Booking error:', err);
      res.status(500).json({ msg: 'Error booking tickets' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};



export const getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        bt.id,
        bt.quantity,
        bt.total_price,
        bt.booked_at AS booking_date,
        bt.payment_status,
        t.name as ticket_type,
        t.price AS ticket_price,
        e.title AS event_title,
        e.location,
        e.event_date
      FROM booked_tickets bt
      JOIN tickets t ON bt.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      WHERE bt.user_id = ?
      ORDER BY bt.booked_at DESC
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'No bookings found' });
    }

    return res.json({ bookings: rows });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

 