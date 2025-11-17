// middleware/checkRole.js

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
      try {
        const userRole = req.user.role; // assuming verifyToken already sets req.user
  
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }
  
        next(); // ✅ allow to continue
      } catch (error) {
        return res.status(500).json({ message: "Error checking user role" });
      }
    };
  };
  