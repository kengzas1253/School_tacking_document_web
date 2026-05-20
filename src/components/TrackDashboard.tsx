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
}

function getInitials(name?: string): string {
  if (!name || name.trim() === "") {
    return "--";
  }

  const parts = name.trim().split(" ");

  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[1][0]
    ).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const map: Record<
    string,
    { color: string; dot: string }
  > = {
    รอดำเนินการ: {
      color:
        "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },

    กำลังดำเนินการ: {
      color:
        "bg-orange-50 text-orange-700 border border-orange-200",
      dot: "bg-orange-500",
    },

    เสร็จร้อยแล้ว: {
      color:
        "bg-green-50 text-green-700 border border-green-200",
      dot: "bg-green-500",
    },

    เสร็จสิ้น: {
      color:
        "bg-green-50 text-green-700 border border-green-200",
      dot: "bg-green-500",
    },

    ยกเลิก: {
      color:
        "bg-red-50 text-red-600 border border-red-200",
      dot: "bg-red-500",
    },
  };

  const style =
    map[status || ""] ?? {
      color:
        "bg-slate-100 text-slate-600 border border-slate-200",
      dot: "bg-slate-400",
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style.color}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${style.dot}`}
      ></span>

      {status || "-"}
    </span>
  );
}

function formatDateTime(
  dateStr?: string
): string {
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

export function TrackDashboard() {
  const [documents, setDocuments] = useState<
    Document[]
  >([]);

  const [filtered, setFiltered] = useState<
    Document[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
  let interval: NodeJS.Timeout;

  const fetchData = async () => {
    try {
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "กรุณาเข้าสู่ระบบก่อนใช้งาน"
        );

        setLoading(false);
        return;
      }

      const uid = session.user.id;

      console.log("UID:", uid);

      const response = await axios.get(
        `${url_api}uid/${uid}`
      );

      console.log(
        "API DATA:",
        response.data
      );

      const data: Document[] =
        Array.isArray(response.data)
          ? response.data
          : [];

      setDocuments(data);
      setFiltered(data);
    } catch (err: any) {
      console.error(
        "API ERROR:",
        err
      );

      if (
        err.response?.status === 404 ||
        err.response?.status === 204
      ) {
        setDocuments([]);
        setFiltered([]);
      } else {
        setError(
          "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // โหลดครั้งแรก
  fetchData();

  // Realtime ทุก 5 วินาที
  interval = setInterval(() => {
    fetchData();
  }, 5000);

  // clear interval ตอนออกหน้า
  return () => clearInterval(interval);

}, []);

  useEffect(() => {
    const q = search.toLowerCase();

    if (!q) {
      setFiltered(documents);
      return;
    }

    setFiltered(
      documents.filter((d) => {
        return (
          (d.doc_number || "")
            .toLowerCase()
            .includes(q) ||

          (d.subject || "")
            .toLowerCase()
            .includes(q) ||

          (d.officer_name || "")
            .toLowerCase()
            .includes(q) ||

          (d.department || "")
            .toLowerCase()
            .includes(q)
        );
      })
    );
  }, [search, documents]);

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <i className="fa-solid fa-table-list text-blue-600"></i>

              <span>
                รายการหนังสือราชการ
              </span>

              {!loading &&
                documents.length > 0 && (
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
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="ค้นหา เลขที่, เรื่อง, ผู้รับผิดชอบ..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-72"
              />
            </div>
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

              <p className="text-sm">
                กำลังโหลดข้อมูล...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24">
              <i className="fa-solid fa-circle-exclamation text-red-400 text-4xl mb-3"></i>

              <p className="text-red-500 font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            documents.length === 0 && (
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
          {!loading &&
            !error &&
            filtered.length > 0 && (
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

                      <th className="text-left px-4 py-3 font-semibold">
                        สถานะ
                      </th>

                      <th className="text-left px-4 py-3 font-semibold">
                        ไฟล์
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* วันที่บันทึก */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                          {formatDateTime(
                            doc.record_datetime
                          )}
                        </td>

                        {/* เลขที่หนังสือ */}
                        <td className="px-4 py-4">
                          <span className="font-bold text-blue-700">
                            {doc.doc_number ||
                              "-"}
                          </span>
                        </td>

                        {/* หน่วยงาน */}
                        <td className="px-4 py-4 text-slate-600 max-w-[180px]">
                          <span className="line-clamp-2">
                            {doc.department ||
                              "-"}
                          </span>
                        </td>

                        {/* ผู้รับผิดชอบ */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getInitials(
                                doc.officer_name
                              )}
                            </div>

                            <span className="text-slate-700 font-medium whitespace-nowrap">
                              {doc.officer_name ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        {/* เรื่อง */}
                        <td className="px-4 py-4 text-slate-700 max-w-[240px]">
                          <span className="line-clamp-2">
                            {doc.subject ||
                              "-"}
                          </span>
                        </td>

                        {/* สถานะ */}
                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              doc.status
                            }
                          />
                        </td>

                        {/* ไฟล์ */}
                        <td className="px-4 py-4">
                          {doc.drive_link ? (
                            <a
                              href={
                                doc.drive_link
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <i className="fa-solid fa-file-arrow-down"></i>

                              <span>
                                ดาวน์โหลด
                              </span>
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs">
                              —
                            </span>
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