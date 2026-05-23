import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

interface NavbarAdminProps {
  userEmail: string;
  currentView: "dashboard" | "add" | "users";
  onViewChange: (view: "dashboard" | "add" | "users") => void;
}

export function NavbarAdmin({ userEmail, currentView, onViewChange }: NavbarAdminProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    Swal.fire({
      icon: "success",
      title: "ออกจากระบบแล้ว",
      timer: 1000,
      showConfirmButton: false,
    });
    navigate("/admin/login");
  };

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-10 rounded-lg">
              <i className="fa-solid fa-shield-halved text-xl text-gray-300"></i>
            </div>
            <div className="leading-tight">
              <p className="font-bold text-lg leading-none">Admin Panel</p>
              <p className="text-gray-400 text-xs mt-0.5">GovDoc Track</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Email */}
            <div className="hidden sm:flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 px-3 py-1.5 rounded-lg">
              <i className="fa-solid fa-circle-user text-gray-300"></i>
              <span className="text-sm text-white max-w-[180px] truncate">{userEmail}</span>
            </div>

            {/* Dashboard */}
            <button
              onClick={() => onViewChange("dashboard")}
              className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 ${
                currentView === "dashboard"
                  ? "bg-white text-gray-800 border-white shadow"
                  : "bg-white bg-opacity-10 hover:bg-opacity-25 text-white border-white border-opacity-30"
              }`}
            >
              <i className="fa-solid fa-chart-bar"></i>
              <span className="hidden md:inline">Dashboard</span>
            </button>

            {/* User Management */}
            <button
              onClick={() => onViewChange("users")}
              className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 ${
                currentView === "users"
                  ? "bg-white text-gray-800 border-white shadow"
                  : "bg-white bg-opacity-10 hover:bg-opacity-25 text-white border-white border-opacity-30"
              }`}
            >
              <i className="fa-solid fa-users-gear"></i>
              <span className="hidden md:inline">User Management</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border bg-white bg-opacity-10 hover:bg-red-600 hover:border-red-500 text-white border-white border-opacity-30 transition-all duration-150"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}