// src/components/shared/Breadcrumb.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">Company Portal</Link>
      {items.map((item, i)=> (
        <div key={i} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          {item.href ? (
            <Link to={item.href} className="text-gray-500 hover:text-gray-700">{item.label}</Link>
          ) : (
            <span className="font-medium" style={{ color: "var(--text-primary-color)" }}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
