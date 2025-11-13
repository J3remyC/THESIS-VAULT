import React from "react";
import { motion } from "framer-motion";

const ProfileInfo = ({ user }) => (
  <motion.div
    className="p-0"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
    <p className="text-gray-300">Name: {user.name}</p>
    <p className="text-gray-300">Email: {user.email}</p>
  </motion.div>
);

export default ProfileInfo;
