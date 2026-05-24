import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

const url_api = "https://school-tacking-document-back.onrender.com/documents/";

interface Document {
  id: number;
  uid?: string;
  record_datetime?: string;
  doc_number?: string;
  doc_date?: string;
  department?: string;
  officer_name?: string;
  subject?: string;
  phone_number?: string;
  status?: string;
  drive_link?: string;
  remarks?: string;
  processing_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
}

type FilterTab =
  | "ทั้งหมด"
  | "รอดำเนินการ"
  | "กำลังดำเนินการ"
  | "เรียบร้อยแล้ว"
  | "ไม่อนุมัติ";

// ============================================================
//  Helpers
// ============================================================
function getInitials(name?: string): string {
  if (!name || name.trim() === "") return "--";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

// ============================================================
//  Status config (รองรับ 4 สถานะ)
// ============================================================
const STATUS_MAP: Record<string, { color: string; dot: string }> = {
  รอดำเนินการ: {
    color: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  กำลังดำเนินการ: {
    color: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
  },
  เรียบร้อยแล้ว: {
    color: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  เสร็จสิ้น: {
    color: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  ไม่อนุมัติ: {
    color: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }: { status?: string }) {
  const style = STATUS_MAP[status || ""] ?? {
    color: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style.color}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
      {status || "-"}
    </span>
  );
}

// ============================================================
//  Filter tabs
// ============================================================
const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "ทั้งหมด", label: "ทั้งหมด", icon: "" },
  { key: "รอดำเนินการ", label: "รอดำเนินการ", icon: "⏳" },
  { key: "กำลังดำเนินการ", label: "กำลังดำเนินการ", icon: "🔄" },
  { key: "เรียบร้อยแล้ว", label: "เรียบร้อยแล้ว", icon: "✅" },
  { key: "ไม่อนุมัติ", label: "ไม่อนุมัติ", icon: "❌" },
];

const TAB_ACTIVE: Record<FilterTab, string> = {
  ทั้งหมด: "bg-blue-600 text-white border-blue-600",
  รอดำเนินการ: "bg-amber-50 text-amber-700 border-amber-300",
  กำลังดำเนินการ: "bg-orange-50 text-orange-700 border-orange-300",
  เรียบร้อยแล้ว: "bg-green-50 text-green-700 border-green-300",
  ไม่อนุมัติ: "bg-red-50 text-red-700 border-red-300",
};

// ============================================================
//  Main Component
// ============================================================
export function TrackDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ทั้งหมด");

  // หน้า Dashboard สำหรับติดตามสถานะหนังสือราชการที่ส่งไปแล้ว โดยดึงข้อมูลจาก API มาแสดงในตาราง พร้อมฟีเจอร์ค้นหาและกรองสถานะต่างๆ
   useEffect(() => {
    document.title = 'หน้าติดตามสถานะหนังสือราชการ';
  }, []); // ตั้งชื่อ title หน้าเว็บเมื่อโหลดครั้งแรก

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    //let interval: NodeJS.Timeout;
    let interval: ReturnType<typeof setInterval>;

    const fetchData = async () => {
      try {
        setError(null);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
          setLoading(false);
          return;
        }
        const uid = session.user.id;
        const response = await axios.get(`${url_api}uid/${uid}`);
        const data: Document[] = Array.isArray(response.data)
          ? response.data
          : [];
        setDocuments(data);
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 204) {
          setDocuments([]);
        } else {
          setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Filter + Search ───────────────────────────────────────
  const filtered = documents.filter((d) => {
    const matchTab = activeTab === "ทั้งหมด" || d.status === activeTab;
    if (!matchTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.doc_number || "").toLowerCase().includes(q) ||
      (d.subject || "").toLowerCase().includes(q) ||
      (d.officer_name || "").toLowerCase().includes(q) ||
      (d.department || "").toLowerCase().includes(q)
    );
  });

  const tabCount = (key: FilterTab) =>
    key === "ทั้งหมด"
      ? documents.length
      : documents.filter((d) => d.status === key).length;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <i className="fa-solid fa-table-list text-blue-600"></i>
              <span>รายการหนังสือราชการ</span>
              {!loading && documents.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {filtered.length} รายการ
                </span>
              )}
            </div>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา เลขที่, เรื่อง, ผู้รับผิดชอบ..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-72"
              />
            </div>
          </div>

          {/* Filter tab bar */}
          <div className="flex items-center gap-2 flex-wrap px-6 py-3 border-b border-slate-100 bg-slate-50/60">
            <span className="text-sm text-slate-500 font-medium mr-1">
              กรอง:
            </span>
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                    ${
                      isActive
                        ? TAB_ACTIVE[tab.key]
                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    }
                  `}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? "bg-white/30" : "bg-slate-100 text-slate-500"}`}
                  >
                    {tabCount(tab.key)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <svg
                className="animate-spin h-8 w-8 text-blue-500 mb-3"
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
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24">
              <i className="fa-solid fa-circle-exclamation text-red-400 text-4xl mb-3"></i>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <i className="fa-solid fa-folder-open text-5xl mb-4 text-slate-300"></i>
              <p className="text-lg font-medium text-slate-500 mb-1">
                ยังไม่ส่งคำร้องติดตามหนังสือราชการ
              </p>
              <p className="text-sm text-slate-400">
                คุณยังไม่มีรายการหนังสือในระบบ
              </p>
            </div>
          )}

          {/* No Result */}
          {!loading &&
            !error &&
            documents.length > 0 &&
            filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <i className="fa-solid fa-magnifying-glass text-4xl mb-3 text-slate-300"></i>
                <p className="font-medium text-slate-500">
                  ไม่พบรายการที่ค้นหา
                </p>
              </div>
            )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-semibold">
                      วันที่บันทึก
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      เลขที่หนังสือ
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      หน่วยงาน
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      ผู้รับผิดชอบ
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      เรื่อง
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">สถานะ</th>
                    <th className="text-left px-4 py-3 font-semibold">ไฟล์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {formatDateTime(doc.record_datetime)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-blue-700">
                          {doc.doc_number || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 min-w-[180px]">
                        {doc.department || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getInitials(doc.officer_name)}
                          </div>
                          <span className="text-slate-700 font-medium whitespace-nowrap">
                            {doc.officer_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700 min-w-[220px]">
                        {doc.subject || "-"}
                      </td>

                      {/* สถานะ + timestamps + remarks */}
                      <td className="px-4 py-4 min-w-[200px]">
                        <StatusBadge status={doc.status} />

                        {doc.processing_at && (
                          <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-semibold text-slate-600">
                              ดำเนินการ:
                            </span>
                            {formatDateTime(doc.processing_at)}
                          </p>
                        )}
                        {doc.completed_at && (
                          <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-semibold text-slate-600">
                              เสร็จ:
                            </span>
                            {formatDateTime(doc.completed_at)}
                          </p>
                        )}
                        {doc.rejected_at && (
                          <p className="mt-0.5 text-[11px] text-red-500 flex items-center gap-1">
                            <span className="font-semibold">ไม่อนุมัติ:</span>
                            {formatDateTime(doc.rejected_at)}
                          </p>
                        )}
                        {doc.remarks && doc.remarks.trim() !== "" && (
                          <p className="mt-1 text-[11px] text-slate-400 italic flex items-start gap-1">
                            <span className="not-italic">💬</span>
                            <span>{doc.remarks}</span>
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {doc.drive_link ? (
                          <a
                            href={doc.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            <i className="fa-solid fa-file-arrow-down"></i>
                            <span>ดาวน์โหลด</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
