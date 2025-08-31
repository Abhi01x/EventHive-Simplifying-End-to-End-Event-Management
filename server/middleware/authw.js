import jwt from "jsonwebtoken";



export default function authorize(roles = []) {
  return async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ success:false, msg: 'No token provided' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      // Role check

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({success:false, msg: 'Forbidden: Insufficient role' });
      }
      // Check user verification from DB
 
      console.log('User authenticated:', req.user);
      
      next();
    } catch (err) {
      console.error("JWT/Auth error:", err.message);
      return res.status(401).json({ success:false, msg: 'Invalid or expired token' });
    }
  };
}
