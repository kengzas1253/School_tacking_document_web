import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Swal from "sweetalert2";

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    document.title = "หน้าเข้าสู่ระบบติดตามหนังสือราชการ";
  }, []); // [] cแสดง title เมื่อ component ถูก mount เท่านั้น

  // ✅ คำนวณค่าต่างๆ จาก email ปัจจุบัน
  const emailLower = email.toLowerCase();
  const isSchoolEmail = emailLower.endsWith("@spa2.ac.th");

  // const adminEmails = new Set([
  //   "kengzas1253@gmail.com",
  //   "asiaminimart.shopnaka@gmail.com",
  //   "bankuankob2023.school@gmail.com",
  // ]);
  const adminEmails = new Set(
    import.meta.env.VITE_ADMIN_EMAILS?.split(",") || [],
  );
  //console.log("Admin Emails:", adminEmails);
  const isAdmin = adminEmails.has(emailLower);

  // ✅ ฟังก์ชันตรวจสอบว่าเป็นอีเมลนักเรียนหรือไม่ (ขึ้นต้นด้วยตัวเลข)
  const isStudentEmail = (email: string): boolean => {
    const localPart = email.toLowerCase().split("@")[0];
    // ตรวจสอบว่าขึ้นต้นด้วยตัวเลข (อย่างน้อย 1 หลัก)
    return /^\d/.test(localPart);
  };

  const isStudent = isSchoolEmail && isStudentEmail(email);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // กรณีไม่ใช่อีเมลโรงเรียน และไม่ใช่แอดมิน
    if (!isSchoolEmail && !isAdmin) {
      Swal.fire({
        icon: "warning",
        title: "อีเมลไม่ถูกต้อง",
        text: "อนุญาตเฉพาะอีเมลโรงเรียน @spa2.ac.th เท่านั้น",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // กรณีเป็นอีเมลโรงเรียนแต่นักเรียน (ขึ้นต้นด้วยตัวเลข)
    if (isStudent && !isAdmin) {
      Swal.fire({
        icon: "warning",
        title: "ไม่อนุญาต",
        text: "ไม่อนุญาตให้นักเรียนที่มีอีเมลโรงเรียน @spa2.ac.th เข้าใช้งาน",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setLoading(true);

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password });

      //console.log("REGISTER DATA:", data);
      //console.log("REGISTER ERROR:", error);

      if (error) {
        Swal.fire({
          icon: "error",
          title: "สมัครสมาชิกไม่สำเร็จ",
          text: error.message,
          confirmButtonColor: "#2563eb",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "สมัครสมาชิกสำเร็จ!",
          text: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี",
          confirmButtonColor: "#2563eb",
        });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      //console.log("LOGIN DATA:", data);
      //console.log("LOGIN ERROR:", error);

      if (error) {
        Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: error.message,
          confirmButtonColor: "#2563eb",
        });
      } else {
        //console.log("USER:", data.user);
        //console.log("SESSION:", data.session);
        //console.log("ACCESS TOKEN:", data.session?.access_token);

        Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ!",
          text: "ยินดีต้อนรับกลับสู่ระบบ",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Header Section */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <i className="fa-solid fa-certificate text-white text-2xl"></i>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            GovDoc Track
          </h1>
        </div>

        <p className="text-slate-600 text-xl font-medium tracking-wide">
          ระบบติดตามหนังสือราชการ
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white text-center">
            {isRegister ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ"}
          </h2>
        </div>

        {/* Card Body */}
        <div className="px-8 py-8">
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <i className="fa-solid fa-envelope text-blue-600 mr-2"></i>
                Email
              </label>

              <input
                type="email"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 placeholder-slate-400"
                placeholder="your.email@spa2.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* แสดงข้อความเตือนกรณีไม่ใช่อีเมลโรงเรียนและไม่ใช่แอดมิน */}
              {email && !isSchoolEmail && !isAdmin && (
                <p className="text-red-500 text-sm mt-1">
                  กรุณาใช้อีเมลโรงเรียน @spa2.ac.th
                </p>
              )}

              {/* แสดงข้อความเตือนกรณีเป็นนักเรียน (ขึ้นต้นด้วยตัวเลข) */}
              {email && isSchoolEmail && isStudent && !isAdmin && (
                <p className="text-red-500 text-sm mt-1">
                  ไม่อนุญาตให้นักเรียน (อีเมลขึ้นต้นด้วยตัวเลข) เข้าใช้งาน
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <i className="fa-solid fa-lock text-blue-600 mr-2"></i>
                Password
              </label>

              <input
                type="password"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 placeholder-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isStudent && !isAdmin)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                  กำลังประมวลผล...
                </span>
              ) : (
                <span>{isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</span>
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200"
            >
              {isRegister
                ? "✓ มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"
                : "+ ยังไม่มีบัญชี? สมัครสมาชิก"}
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-shield-halved text-green-500"></i>
          <span>Secure</span>
        </div>

        <div className="flex items-center gap-1">
          <i className="fa-solid fa-lock text-green-500"></i>
          <span>Encrypted</span>
        </div>

        <div className="flex items-center gap-1">
          <i className="fa-solid fa-check-circle text-green-500"></i>
          <span>Verified</span>
        </div>
      </div>

      {/* Admin Login Link */}
      <div className="mt-4 text-center">
        <a
          href="/admin/login"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200 flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-shield-halved text-xs"></i>
          เข้าสู่ระบบสำหรับผู้ดูแลระบบ
        </a>
      </div>
    </div>
  );
}
