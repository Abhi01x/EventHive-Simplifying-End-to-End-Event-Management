import jwt from 'jsonwebtoken';

export default function (roles = []) {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });
    // console.log(token); 
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
       
       
      if (roles.length && !roles.includes(req.user.role))
        return res.status(403).json({ msg: 'Forbidden' });
      
      next();
    } catch {
      res.status(401).json({ msg: 'Invalid token' });
    }
  };
}; 
