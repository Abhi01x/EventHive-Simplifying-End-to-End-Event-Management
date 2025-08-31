import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'gaurvkusum@0909',   
  database: 'eventhive',        
  port: 3306
});

console.log('Connected to MySQL database');

export default pool;

 