export const authorizeRoles = (...allowed) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) return res.status(401).json({ message: "Unauthorized" });
      if (!allowed.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }
      next();
    } catch (e) {
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};
