import pool from './db.js'; // adjust the path if needed

const initSchema = async () => {
  try {
    const connection = await pool.getConnection();

    // Example: Create a users table
<<<<<<< HEAD
         await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              email VARCHAR(150) UNIQUE NOT NULL,
              phone VARCHAR(15) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              role ENUM('user','organizer') DEFAULT 'user',
              loyalty_points INT DEFAULT 0,
              is_banned BOOLEAN DEFAULT FALSE,
              verification BOOLEAN DEFAULT FALSE,
              otp_code VARCHAR(6),
              otp_expires TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
      `);
        
      await connection.query(`
          CREATE TABLE IF NOT EXISTS category (
              _id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(200) NOT NULL
          )
      `); 
         
      await connection.query(`
          CREATE TABLE IF NOT EXISTS events (
              event_id INT AUTO_INCREMENT PRIMARY KEY,
              organizer_id INT NOT NULL,
              category_id INT NOT NULL,
              title VARCHAR(200) NOT NULL,
              description TEXT,
              location VARCHAR(20),
              address VARCHAR(255),
              event_date DATE NOT NULL,
              start_time time,
              end_time time, 
              status ENUM('draft','published','cancelled','completed') DEFAULT 'draft',
              image_url VARCHAR(255),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (organizer_id) REFERENCES users(id),
              FOREIGN KEY (category_id) REFERENCES category(_id)
          )
      `);
 
 
      await connection.query(`
          CREATE TABLE IF NOT EXISTS tickets (
              ticket_id INT AUTO_INCREMENT PRIMARY KEY,
              event_id INT NOT NULL,
              name VARCHAR(100) NOT NULL,
              price DECIMAL(10,2) DEFAULT 0.00,
              quantityper_user INT DEFAULT 1,
              total_quantity INT DEFAULT 0,
              sold_quantity INT DEFAULT 0,  
              sales_start TIMESTAMP,
              sales_end TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (event_id) REFERENCES events(event_id)
          )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS booked_tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          ticket_id INT NOT NULL,
          quantity INT NOT NULL,
          total_price DECIMAL(10,2),
          payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
          booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
                );
         `);

         await connection.query(`
            CREATE TABLE IF NOT EXISTS attendees (
                attendee_id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT,
                name VARCHAR(100),
                email VARCHAR(150),
                phone VARCHAR(20),
                gender ENUM('male', 'female', 'other'),
                FOREIGN KEY (booking_id) REFERENCES booked_tickets(id) ON DELETE CASCADE
              );
          `);

=======
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            phone VARCHAR(15) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('user','organizer') DEFAULT 'user',
            loyalty_points INT DEFAULT 0,
            is_banned BOOLEAN DEFAULT FALSE,
            verification BOOLEAN DEFAULT FALSE,
            otp_code VARCHAR(6),
            otp_expire TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await connection.query(`
        CREATE TABLE IF NOT EXISTS category (
            _id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL
        )
    `);

     await connection.query(`
        CREATE TABLE IF NOT EXISTS events (
            event_id INT AUTO_INCREMENT PRIMARY KEY,
            organizer_id INT NOT NULL,
            category_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            location VARCHAR(255),
            event_date DATETIME NOT NULL,
            status ENUM('draft','published','cancelled','completed') DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES Users(user_id),
            FOREIGN KEY (category_id) REFERENCES category(_id)
        )
    `);
    
>>>>>>> 9e7efe4ede171174814304f98f9f5d5696e6f513
    console.log(' Database schema initialized');
    connection.release();
  } catch (err) {
    console.error(' Error initializing schema:', err);
  }
};

export default initSchema;



