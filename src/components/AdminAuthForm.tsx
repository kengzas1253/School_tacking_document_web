import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export function AdminAuthForm() {
  useEffect(() => {
    document.title = "หน้าเข้าสู่ระบบผู้ดูแลระบบ";
  }, []); // ตั้งชื่อ title หน้าเว็บเมื่อโหลดครั้งแรก
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Step 1: Login with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      // Login failed
      if (authError || !data.session) {
        await Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: authError?.message || "ไม่สามารถเข้าสู่ระบบได้",
          confirmButtonColor: "#6b7280",
        });

        return;
      }

      const accessToken = data.session.access_token;

      // Step 2: Verify admin role via API
      const res = await fetch(
        "https://school-tacking-document-backv2.onrender.com/api/admin",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await res.json();

      // Not admin
      if (!res.ok) {
        await supabase.auth.signOut();

        await Swal.fire({
          icon: "error",
          title: "ไม่มีสิทธิ์เข้าถึง",
          text: result.error || "คุณไม่มีสิทธิ์เข้าถึงหน้า Admin",
          confirmButtonColor: "#6b7280",
        });

        return;
      }

      // Success
      await Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ!",
        text: `ยินดีต้อนรับ Admin: ${result.user}`,
        confirmButtonColor: "#6b7280",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect to dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อ Server ได้",
        confirmButtonColor: "#6b7280",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg shadow-lg shadow-gray-900/50">
              <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
            </div>

            <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
          </div>

          <p className="text-gray-600 text-sm font-medium tracking-wide">
            เฉพาะผู้ดูแลระบบเท่านั้น
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-5">
            <h2 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
              <i className="fa-solid fa-lock text-gray-300 text-sm"></i>
              Admin Login
            </h2>
          </div>

          {/* Card Body */}
          <div className="px-8 py-8">
            <form onSubmit={handleAdminLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-solid fa-envelope text-gray-500 mr-2"></i>
                  Email
                </label>

                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-solid fa-lock text-gray-500 mr-2"></i>
                  Password
                </label>

                <input
                  type="password"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-gray-900/50 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
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
                    กำลังตรวจสอบสิทธิ์...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-right-to-bracket"></i>
                    เข้าสู่ระบบ Admin
                  </span>
                )}
              </button>
            </form>

            {/* Back to User Login */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <a
                href="/"
                className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                กลับหน้าเข้าสู่ระบบหลัก
              </a>
            </div>
          </div>
        </div>

        {/* Warning Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <i className="fa-solid fa-triangle-exclamation text-yellow-600"></i>
          <span>Restricted Area — Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
