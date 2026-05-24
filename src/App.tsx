import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { AuthForm } from "./components/AuthForm";
import AdminDashboard from "./components/AdminDashboard";
import { AdminAuthForm } from "./components/AdminAuthForm";
import { RegisterPage } from "./components/RegisterPage";
import { TrackDashboard } from "./components/TrackDashboard";
import { FooterPage } from "./components/FooterPage";
import "./index.css";

type View = "register" | "dashboard";

// ===== หน้าหลัก (User) =====
function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("register");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView("register");
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-slate-600 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Logged-in layout
  if (user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between h-16">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setCurrentView("register")}
              >
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <i className="fa-solid fa-certificate text-xl"></i>
                </div>
                <div className="leading-tight">
                  <p className="font-bold text-lg leading-none">GovDoc Track</p>
                  <p className="text-blue-200 text-xs mt-0.5">
                    ระบบติดตามหนังสือราชการ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 px-3 py-1.5 rounded-lg">
                  <i className="fa-solid fa-circle-user text-blue-200"></i>
                  <span className="text-sm text-white max-w-[180px] truncate">
                    {user?.email}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 ${
                    currentView === "dashboard"
                      ? "bg-white text-blue-700 border-white shadow"
                      : "bg-white bg-opacity-10 hover:bg-opacity-25 text-white border-white border-opacity-30"
                  }`}
                >
                  <i className="fa-solid fa-chart-line"></i>
                  <span className="hidden md:inline">
                    Dashboard ติดตามสถานะ
                  </span>
                </button>

                {currentView === "dashboard" && (
                  <button
                    onClick={() => setCurrentView("register")}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border bg-white bg-opacity-10 hover:bg-opacity-25 text-white border-white border-opacity-30 transition-all duration-150"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span className="hidden md:inline">บันทึกหนังสือ</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border bg-white bg-opacity-10 hover:bg-red-500 hover:border-red-400 text-white border-white border-opacity-30 transition-all duration-150"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {currentView === "register" ? <RegisterPage /> : <TrackDashboard />}
        </main>

        <FooterPage />
      </div>
    );
  }

  // Not logged in
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
      <FooterPage />
    </div>
  );
}

// ===== Root App พร้อม Router =====
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ หน้า Admin Login */}
        <Route path="/admin/login" element={<AdminAuthForm />} />
        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* ✅ หน้าหลัก (ทุก path อื่น) */}
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;