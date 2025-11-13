import React, { useState, useRef } from "react";

const UploadDropzone = ({ onFileSelected, disabled }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
        dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-gray-700"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-gray-600"}`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
        }}
        disabled={disabled}
      />
      <div className="text-gray-300">
        <div className="font-medium">Drag and drop a file here</div>
        <div className="text-sm text-gray-400 mt-1">or click to select</div>
      </div>
    </div>
  );
};

export default UploadDropzone;
