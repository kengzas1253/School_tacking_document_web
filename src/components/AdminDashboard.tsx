import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { NavbarAdmin } from "./NavbarAdmin";
import { FooterAdmin } from "./FooterAdmin";
import { UserManage } from "./UserManage";

// ============================================================
//  Constants
// ============================================================
const API_URL = "https://school-tacking-document-back.onrender.com/documents/";

// ============================================================
//  Types
// ============================================================
type Status = "รอดำเนินการ" | "กำลังดำเนินการ" | "เรียบร้อยแล้ว" | "ไม่อนุมัติ";

type FilterTab = "ทั้งหมด" | Status;

interface Document {
  id: number;
  uid: string;
  record_datetime: string;
  doc_number: string;
  doc_date: string;
  department: string;
  officer_name: string;
  subject: string;
  phone_number: string;
  status: Status;
  drive_link: string;
  remarks: string;
  processing_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
}

// ============================================================
//  Status Config
// ============================================================
const STATUS_CONFIG: Record<
  Status,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  รอดำเนินการ: {
    label: "รอดำเนินการ",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    border: "border-amber-300",
  },
  กำลังดำเนินการ: {
    label: "กำลังดำเนินการ",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
    border: "border-blue-300",
  },
  เรียบร้อยแล้ว: {
    label: "เรียบร้อยแล้ว",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
    border: "border-emerald-300",
  },
  ไม่อนุมัติ: {
    label: "ไม่อนุมัติ",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-400",
    border: "border-red-300",
  },
};

// ============================================================
//  Helpers
// ============================================================
const fmt = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getThailandISOString = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const getPart = (part: Intl.DateTimeFormatPartTypes) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: part === "year" ? "numeric" : undefined,
      month: part === "month" ? "2-digit" : undefined,
      day: part === "day" ? "2-digit" : undefined,
      hour: part === "hour" ? "2-digit" : undefined,
      minute: part === "minute" ? "2-digit" : undefined,
      second: part === "second" ? "2-digit" : undefined,
      hour12: false,
    } as Intl.DateTimeFormatOptions)
      .formatToParts(now)
      .find((p) => p.type === part)?.value ?? "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = pad(Number(getPart("hour")) % 24);
  const minute = getPart("minute");
  const second = getPart("second");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
};

// ============================================================
//  Sub-components
// ============================================================
function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-white/60 ${color}`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-extrabold leading-none">{count}</p>
        <p className="text-sm font-medium mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["รอดำเนินการ"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ============================================================
//  Filter Tab Bar
// ============================================================
const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "ทั้งหมด", label: "ทั้งหมด", icon: "" },
  { key: "รอดำเนินการ", label: "รอดำเนินการ", icon: "⏳" },
  { key: "กำลังดำเนินการ", label: "กำลังดำเนินการ", icon: "🔄" },
  { key: "เรียบร้อยแล้ว", label: "เรียบร้อยแล้ว", icon: "✅" },
  { key: "ไม่อนุมัติ", label: "ไม่อนุมัติ", icon: "❌" },
];

// ============================================================
//  Main Component
// ============================================================
export default function AdminDashboard() {
  useEffect(() => {
    document.title = "แดชบอร์ดผู้ดูแลระบบ - ระบบติดตามหนังสือราชการ";
  }, []); // ตั้งชื่อ title หน้าเว็บเมื่อโหลดครั้งแรก
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState("");
  const [currentView, setCurrentView] = useState<"dashboard" | "add" | "users">(
    "dashboard",
  );
  const [authChecked, setAuthChecked] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterTab>("ทั้งหมด");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingRemarksId, setEditingRemarksId] = useState<number | null>(null);
  const [editingRemarksValue, setEditingRemarksValue] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Auth Guard ────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setUserEmail(session.user.email ?? "");
      setAuthChecked(true);
    };
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<Document[]>(API_URL);
      setDocuments(res.data);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) fetchDocuments();
  }, [fetchDocuments, authChecked]);

  // ── Update status ─────────────────────────────────────────
  const handleStatusChange = async (doc: Document, newStatus: Status) => {
    if (doc.status === newStatus) return;
    setUpdatingId(doc.id);
    const now = getThailandISOString();
    const payload: Partial<Document> & { status: Status } = {
      status: newStatus,
    };
    if (newStatus === "กำลังดำเนินการ") payload.processing_at = now;
    if (newStatus === "เรียบร้อยแล้ว") payload.completed_at = now;
    if (newStatus === "ไม่อนุมัติ") payload.rejected_at = now;
    try {
      await axios.put(`${API_URL}${doc.id}`, payload);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, ...payload } : d)),
      );
    } catch {
      alert("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Remarks ───────────────────────────────────────────────
  const handleEditRemarks = (doc: Document) => {
    setEditingRemarksId(doc.id);
    setEditingRemarksValue(doc.remarks || "");
  };
  const handleSaveRemarks = async (id: number) => {
    try {
      await axios.put(`${API_URL}${id}`, { remarks: editingRemarksValue });
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, remarks: editingRemarksValue } : d,
        ),
      );
    } catch {
      alert("ไม่สามารถบันทึกหมายเหตุได้ กรุณาลองใหม่");
    } finally {
      setEditingRemarksId(null);
      setEditingRemarksValue("");
    }
  };
  const handleCancelRemarks = () => {
    setEditingRemarksId(null);
    setEditingRemarksValue("");
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`ยืนยันการลบเอกสาร "${doc.subject}" ?`)) return;
    setDeletingId(doc.id);
    try {
      await axios.delete(`${API_URL}${doc.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      alert("ไม่สามารถลบเอกสารได้ กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Search & Filter ───────────────────────────────────────
  const handleSearch = () => setSearchQuery(searchInput.trim());
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };
  const filtered = documents.filter((d) => {
    const matchTab = activeTab === "ทั้งหมด" || d.status === activeTab;
    if (!matchTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.doc_number.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q) ||
      d.officer_name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.phone_number.includes(q) ||
      (d.remarks || "").toLowerCase().includes(q)
    );
  });

  // ── Stats ─────────────────────────────────────────────────
  const total = documents.length;
  const waiting = documents.filter((d) => d.status === "รอดำเนินการ").length;
  const processing = documents.filter(
    (d) => d.status === "กำลังดำเนินการ",
  ).length;
  const done = documents.filter((d) => d.status === "เรียบร้อยแล้ว").length;
  const rejected = documents.filter((d) => d.status === "ไม่อนุมัติ").length;

  const tabCount = (key: FilterTab) =>
    key === "ทั้งหมด"
      ? total
      : key === "รอดำเนินการ"
        ? waiting
        : key === "กำลังดำเนินการ"
          ? processing
          : key === "เรียบร้อยแล้ว"
            ? done
            : rejected;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* ── Loading / auth check ── */}
      {!authChecked && (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
          </div>
        </div>
      )}

      {/* ── Authenticated content ── */}
      {authChecked && (
        <>
          <NavbarAdmin
            userEmail={userEmail}
            currentView={currentView}
            onViewChange={setCurrentView}
          />

          {/* flex-1 pushes FooterAdmin to the bottom */}
          <main className="flex-1 flex flex-col">
            {/* Dashboard View */}
            {currentView === "dashboard" && (
              <div className="w-full px-4 md:px-6 py-8 space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    แดชบอร์ดผู้ดูแลระบบ
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    ติดตามสถานะเอกสารทั้งหมดในระบบ
                  </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <StatCard
                    label="เอกสารทั้งหมด"
                    count={total}
                    color="bg-slate-100 text-slate-700"
                    icon="📋"
                  />
                  <StatCard
                    label="รอดำเนินการ"
                    count={waiting}
                    color="bg-amber-100 text-amber-800"
                    icon="⏳"
                  />
                  <StatCard
                    label="กำลังดำเนินการ"
                    count={processing}
                    color="bg-blue-100 text-blue-800"
                    icon="🔄"
                  />
                  <StatCard
                    label="เรียบร้อยแล้ว"
                    count={done}
                    color="bg-emerald-100 text-emerald-800"
                    icon="✅"
                  />
                  <StatCard
                    label="ไม่อนุมัติ"
                    count={rejected}
                    color="bg-red-100 text-red-800"
                    icon="❌"
                  />
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ค้นหา เลขที่หนังสือ / เรื่อง / ผู้รับผิดชอบ / หน่วยงาน / หมายเหตุ"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-sm"
                  >
                    ค้นหา
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2.5 bg-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-300 transition"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                {/* Filter tab bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500 font-medium mr-1">
                    กรอง:
                  </span>
                  {FILTER_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const tabCfg =
                      tab.key !== "ทั้งหมด"
                        ? STATUS_CONFIG[tab.key as Status]
                        : null;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          isActive
                            ? tabCfg
                              ? `${tabCfg.bg} ${tabCfg.text} ${tabCfg.border} shadow-sm`
                              : "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tab.icon && <span>{tab.icon}</span>}
                        <span>{tab.label}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? "bg-white/30 text-inherit"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {tabCount(tab.key)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      กำลังโหลดข้อมูล...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
                      <span className="text-4xl">📭</span>
                      <p className="text-sm">ไม่พบข้อมูลเอกสาร</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wide">
                            <th className="px-4 py-3 font-semibold">
                              วันที่บันทึก
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              เลขที่หนังสือ
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              วันที่หนังสือ
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              หน่วยงาน
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              ผู้รับผิดชอบ
                            </th>
                            <th className="px-4 py-3 font-semibold">เรื่อง</th>
                            <th className="px-4 py-3 font-semibold">
                              โทรศัพท์
                            </th>
                            <th className="px-4 py-3 font-semibold">สถานะ</th>
                            <th className="px-4 py-3 font-semibold">ไฟล์</th>
                            <th className="px-4 py-3 font-semibold">
                              หมายเหตุ
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              เปลี่ยนสถานะ
                            </th>
                            <th className="px-4 py-3 font-semibold">ลบ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((doc) => (
                            <tr
                              key={doc.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                                {fmt(doc.record_datetime)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-slate-800">
                                {doc.doc_number}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                                {fmtDate(doc.doc_date)}
                              </td>
                              <td className="px-4 py-3 text-slate-700 min-w-[180px]">
                                {doc.department}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                                {doc.officer_name}
                              </td>
                              <td className="px-4 py-3 text-slate-700 min-w-[220px]">
                                {doc.subject}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                                {doc.phone_number}
                              </td>
                              <td className="px-4 py-3 min-w-[170px]">
                                <StatusBadge status={doc.status} />
                                {doc.processing_at && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    ดำเนินการ: {fmt(doc.processing_at)}
                                  </p>
                                )}
                                {doc.completed_at && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    เสร็จ: {fmt(doc.completed_at)}
                                  </p>
                                )}
                                {doc.rejected_at && (
                                  <p className="text-[10px] text-red-400 mt-0.5">
                                    ไม่อนุมัติ: {fmt(doc.rejected_at)}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {doc.drive_link ? (
                                  <a
                                    href={doc.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
                                  >
                                    ⬇ Download
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 min-w-[200px] max-w-[280px]">
                                {editingRemarksId === doc.id ? (
                                  <div className="flex flex-col gap-1.5">
                                    <textarea
                                      value={editingRemarksValue}
                                      onChange={(e) =>
                                        setEditingRemarksValue(e.target.value)
                                      }
                                      rows={2}
                                      autoFocus
                                      placeholder="เพิ่มหมายเหตุ..."
                                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() =>
                                          handleSaveRemarks(doc.id)
                                        }
                                        className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition"
                                      >
                                        บันทึก
                                      </button>
                                      <button
                                        onClick={handleCancelRemarks}
                                        className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-300 transition"
                                      >
                                        ยกเลิก
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group flex items-start gap-2">
                                    <p className="text-xs text-slate-600 flex-1 break-words whitespace-pre-wrap">
                                      {doc.remarks &&
                                      doc.remarks.trim() !== "" ? (
                                        doc.remarks
                                      ) : (
                                        <span className="text-slate-300 italic">
                                          ไม่มีหมายเหตุ
                                        </span>
                                      )}
                                    </p>
                                    <button
                                      onClick={() => handleEditRemarks(doc)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 text-slate-400 hover:text-blue-600"
                                      title="แก้ไขหมายเหตุ"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <select
                                  value={doc.status}
                                  disabled={updatingId === doc.id}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      doc,
                                      e.target.value as Status,
                                    )
                                  }
                                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="รอดำเนินการ">
                                    รอดำเนินการ
                                  </option>
                                  <option value="กำลังดำเนินการ">
                                    กำลังดำเนินการ
                                  </option>
                                  <option value="เรียบร้อยแล้ว">
                                    เรียบร้อยแล้ว
                                  </option>
                                  <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                                </select>
                                {updatingId === doc.id && (
                                  <span className="block mt-1 text-[10px] text-slate-400 animate-pulse">
                                    กำลังบันทึก...
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => handleDelete(doc)}
                                  disabled={deletingId === doc.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 active:scale-95 transition disabled:opacity-50"
                                >
                                  {deletingId === doc.id ? (
                                    <span className="animate-pulse">
                                      กำลังลบ...
                                    </span>
                                  ) : (
                                    <>🗑 ลบ</>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loading && filtered.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                      แสดง {filtered.length} รายการ
                      {searchQuery && ` (กรองจากทั้งหมด ${total} รายการ)`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Manage View */}
            {currentView === "users" && (
              <div className="w-full px-4 md:px-6 py-8">
                <UserManage />
              </div>
            )}
          </main>
        </>
      )}

      {/* Footer always at bottom */}
      <FooterAdmin />
    </div>
  );
}
