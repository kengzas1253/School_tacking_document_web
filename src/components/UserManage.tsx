import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";

interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("ไม่พบ session กรุณาล็อกอินใหม่");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export function UserManage() {
  useEffect(() => {
    document.title = "จัดการผู้ใช้งาน - ระบบติดตามหนังสือราชการ";
  }, []); // ตั้งชื่อ title หน้าเว็บเมื่อโหลดครั้งแรก
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "user" | "admin">("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        "https://school-tacking-document-backv2.onrender.com/api/admin/user",
        {
          headers,
        },
      );
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data: User[] = await res.json();
      setUsers(data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        confirmButtonColor: "#374151",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (user: User, newRole: "user" | "admin") => {
    if (user.role === newRole) return;

    const confirm = await Swal.fire({
      icon: "question",
      title: "ยืนยันการเปลี่ยนสิทธิ์?",
      html: `เปลี่ยนสิทธิ์ของ <b>${user.email}</b><br>จาก <b>${user.role}</b> เป็น <b>${newRole}</b>`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#374151",
      cancelButtonColor: "#9CA3AF",
    });

    if (!confirm.isConfirmed) return;

    setUpdatingId(user.id);
    try {
      const headers = await getAuthHeaders();
      // Fixed: Changed from localhost to the correct API endpoint
      const res = await fetch(
        `https://school-tacking-document-backv2.onrender.com/api/admin/user/${user.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (!res.ok) throw new Error("อัปเดตไม่สำเร็จ");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );

      Swal.fire({
        icon: "success",
        title: "อัปเดตสิทธิ์สำเร็จ",
        text: `${user.email} ถูกเปลี่ยนเป็น ${newRole} แล้ว`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัปเดตสิทธิ์ได้ กรุณาลองใหม่",
        confirmButtonColor: "#374151",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-users-gear text-gray-600"></i>
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ดู และปรับสิทธิ์ผู้ใช้งานทั้งหมดในระบบ
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          <i
            className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
          ></i>
          รีเฟรช
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <i className="fa-solid fa-users text-gray-600 text-lg"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400">ผู้ใช้ทั้งหมด</p>
            <p className="text-xl font-bold text-gray-800">{users.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <i className="fa-solid fa-user text-blue-500 text-lg"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400">User</p>
            <p className="text-xl font-bold text-gray-800">
              {users.filter((u) => u.role === "user").length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2 bg-amber-50 rounded-lg">
            <i className="fa-solid fa-shield-halved text-amber-500 text-lg"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400">Admin</p>
            <p className="text-xl font-bold text-gray-800">
              {users.filter((u) => u.role === "admin").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="ค้นหาอีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-filter text-gray-400 text-sm"></i>
          {(["all", "user", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-150 ${
                filterRole === role
                  ? role === "all"
                    ? "bg-gray-800 text-white border-gray-800 shadow"
                    : role === "admin"
                      ? "bg-amber-500 text-white border-amber-500 shadow"
                      : "bg-blue-500 text-white border-blue-500 shadow"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {role === "all" && <i className="fa-solid fa-users"></i>}
              {role === "user" && <i className="fa-solid fa-user"></i>}
              {role === "admin" && (
                <i className="fa-solid fa-shield-halved"></i>
              )}
              {role === "all" ? "ทั้งหมด" : role === "admin" ? "Admin" : "User"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i>
            <p className="text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fa-solid fa-users-slash text-3xl mb-3"></i>
            <p className="text-sm">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-3 font-semibold w-8">#</th>
                  <th className="text-left px-3 py-3 font-semibold">อีเมล</th>
                  <th className="text-left px-3 py-3 font-semibold w-20">สิทธิ์</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell w-36">
                    วันที่สมัคร
                  </th>
                  <th className="text-left px-3 py-3 font-semibold w-24">
                    เปลี่ยนสิทธิ์
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-4 text-gray-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 max-w-[140px] md:max-w-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-gray-800 truncate block"
                          title={user.email}
                        >
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <i className="fa-solid fa-shield-halved text-[10px]"></i>
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          <i className="fa-solid fa-user text-[10px]"></i>
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs hidden md:table-cell whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) =>
                            handleRoleChange(
                              user,
                              e.target.value as "user" | "admin",
                            )
                          }
                          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updatingId === user.id && (
                          <i className="fa-solid fa-circle-notch fa-spin text-gray-400 text-xs"></i>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">
        แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้งาน
      </p>
    </div>
  );
}