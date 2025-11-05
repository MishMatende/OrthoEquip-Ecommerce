import React from "react";
import { Outlet } from "react-router-dom";

export default function OtherLayout() {
  return (
    <div className="min-h-screen bg-gray-100 px-2 sm:px-4">
      <Outlet />
    </div>
  );
}
