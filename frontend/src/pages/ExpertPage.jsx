import React, { useState } from "react"; // Import useState
import { Outlet } from "react-router-dom";
import ExpertSidebar from "../components/ExpertSidebar";

export default function ExpertPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Add state

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Pass state to the sidebar */}
      <ExpertSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}