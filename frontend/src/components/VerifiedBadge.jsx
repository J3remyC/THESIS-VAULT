import React from "react";
import { BadgeCheck } from "lucide-react";

const VerifiedBadge = ({ isVerified, size = "sm" }) => {
  if (!isVerified) return null;

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <BadgeCheck
      className={`${sizeClasses[size]} text-red-800 inline-block`}
      aria-label="Verified user"
      title="Verified user"
    />
  );
};

export default VerifiedBadge;
