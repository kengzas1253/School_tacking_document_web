import { useState, useEffect  } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";


// Test API
//const url_api = "http://localhost:3000/documents/";
const url_api = "https://school-tacking-document-back.onrender.com/documents/";

interface FormData {
  docNum: string;
  docDate: string;
  department: string;
  owner: string;
  subject: string;
  phone: string;
  status: string;
  remark: string;
}

// Thailand Timezone (UTC+7)
const getThailandISOString = () => {
  const now = new Date();

  // เวลาไทย UTC+7
  const thailandTime = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

  const year = thailandTime.getFullYear();
  const month = String(thailandTime.getMonth() + 1).padStart(2, "0");
  const day = String(thailandTime.getDate()).padStart(2, "0");

  const hours = String(thailandTime.getHours()).padStart(2, "0");
  const minutes = String(thailandTime.getMinutes()).padStart(2, "0");
  const seconds = String(thailandTime.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// แปลงชื่อไฟล์เป็น timestamp เพื่อหลีกเลี่ยงปัญหาชื่อภาษาไทย/อักขระพิเศษ
// รูปแบบ: YYYYMMDD_HHmmss_mmm.ext  เช่น  20260522_180530_123.pdf
const buildSafeFileName = (originalFile: File): string => {
  const now = new Date();

  // ดึงส่วนประกอบเวลาไทย (UTC+7)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year:   "numeric",
    month:  "2-digit",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const YYYY = get("year");
  const MM   = get("month");
  const DD   = get("day");
  const HH   = String(Number(get("hour")) % 24).padStart(2, "0"); // กัน "24" กรณี midnight
  const mm   = get("minute");
  const ss   = get("second");
  const ms   = String(now.getMilliseconds()).padStart(3, "0");

  // ดึงนามสกุลไฟล์เดิม (ถ้าไม่มีให้ใช้ bin)
  const ext = originalFile.name.includes(".")
    ? originalFile.name.split(".").pop()!.toLowerCase()
    : "bin";

  return `${YYYY}${MM}${DD}_${HH}${mm}${ss}_${ms}.${ext}`;
};

export function RegisterPage() {
  useEffect(() => {
    document.title = 'หน้าลงทะเบียนติดตามหนังสือราชการ';
  }, []); // ตั้งชื่อ title หน้าเว็บเมื่อโหลดครั้งแรก
  const [formData, setFormData] = useState<FormData>({
    docNum: "",
    docDate: "",
    department: "",
    owner: "",
    subject: "",
    phone: "",
    status: "รอดำเนินการ",
    remark: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const [fileName, setFileName] = useState(
    "คลิกเพื่อเลือกไฟล์.pdf หรือลากมาวางที่นี่ (ไม่เกิน 5MB)",
  );

  const [loading, setLoading] = useState(false);

  const departments = [
    "กลุ่มสาระภาษาไทย",
    "กลุ่มสาระคณิตศาสตร์",
    "กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี",
    "กลุ่มสาระสังคมศึกษาฯ",
    "กลุ่มสาระสุขศึกษาและพลศึกษา",
    "กลุ่มสาระศิลปะ",
    "กลุ่มสาระการงานอาชีพ",
    "กลุ่มสาระภาษาต่างประเทศ",
    "ฝ่ายบริหารวิชาการ",
    "ฝ่ายบริหารงานบุคคล",
    "ฝ่ายบริหารงบประมาณ",
    "ฝ่ายบริหารทั่วไป",
    "งานธุรการ",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "ไฟล์ใหญ่เกินกำหนด",
          text: "กรุณาเลือกไฟล์ขนาดไม่เกิน 5MB",
        });

        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name); // แสดงชื่อไฟล์เดิมให้ผู้ใช้เห็น (UX)
    }
  };

  const handleDragAndDrop = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      // check file size
      if (droppedFile.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "ไฟล์ใหญ่เกินกำหนด",
          text: "กรุณาเลือกไฟล์ขนาดไม่เกิน 5MB",
        });

        return;
      }

      setFile(droppedFile);
      setFileName(droppedFile.name); // แสดงชื่อไฟล์เดิมให้ผู้ใช้เห็น (UX)
    }
  };

  // upload file to supabase storage
  // ชื่อไฟล์ที่ upload จะถูกเปลี่ยนเป็น timestamp เพื่อหลีกเลี่ยงปัญหาภาษาไทย
  const uploadFileToSupabase = async (
    file: File,
  ): Promise<string | null> => {
    try {
      // สร้างชื่อไฟล์ที่ปลอดภัย เช่น 20260522_180530_123.pdf
      const safeFileName = buildSafeFileName(file);
      const uploadPath   = `uploads/${safeFileName}`;

      console.log("Original filename :", file.name);
      console.log("Safe filename      :", safeFileName);

      // IMPORTANT: bucket name ต้องตรงกับ Supabase
      const { error } = await supabase.storage
        .from("Documents-Bucket")
        .upload(uploadPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase Upload Error:", error);
        return null;
      }

      // get public url
      const { data } = supabase.storage
        .from("Documents-Bucket")
        .getPublicUrl(uploadPath);

      console.log("Public URL:", data.publicUrl);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload File Error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // validate
      if (
        !formData.docNum ||
        !formData.docDate ||
        !formData.department ||
        !formData.owner ||
        !formData.subject
      ) {
        Swal.fire({
          icon: "warning",
          title: "กรอกข้อมูลไม่ครบ",
          text: "กรุณากรอกข้อมูลที่มี * ให้ครบ",
        });

        setLoading(false);
        return;
      }

      // get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Swal.fire({
          icon: "error",
          title: "ไม่พบผู้ใช้งาน",
          text: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        });

        setLoading(false);
        return;
      }

      console.log("Current User:", user);

      // upload file
      let fileUrl = "";

      if (file) {
        Swal.fire({
          title: "กำลังอัปโหลดไฟล์...",
          text: "กรุณารอสักครู่",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const uploadedUrl = await uploadFileToSupabase(file);

        if (!uploadedUrl) {
          Swal.fire({
            icon: "error",
            title: "อัปโหลดไฟล์ไม่สำเร็จ",
            text: "กรุณาลองใหม่อีกครั้ง",
          });

          setLoading(false);
          return;
        }

        fileUrl = uploadedUrl;
      }

      // payload สำหรับ API
      const payload = {
        uid: user.id,

        // Thailand Time
        record_datetime: getThailandISOString(),

        doc_number: formData.docNum,
        doc_date: formData.docDate,

        department: formData.department,

        officer_name: formData.owner,

        subject: formData.subject,

        phone_number: formData.phone,

        status: formData.status,

        drive_link: fileUrl,

        remarks: formData.remark,

        processing_at: null,
        completed_at: null,
      };

      console.log("Payload:", payload);

      const response = await axios.post(
        url_api,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("API Response:", response.data);

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "บันทึกข้อมูลสำเร็จ",
          text: "ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว",
          timer: 2000,
          showConfirmButton: false,
        });

        // reset form
        setFormData({
          docNum: "",
          docDate: "",
          department: "",
          owner: "",
          subject: "",
          phone: "",
          status: "รอดำเนินการ",
          remark: "",
        });

        setFile(null);

        setFileName(
          "คลิกเพื่อเลือกไฟล์ หรือลากมาวางที่นี่ (ไม่เกิน 5MB)",
        );
      }
    } catch (error: any) {
      console.error("Submit Error:", error);

      console.log("Error Response:", error.response);

      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "เกิดข้อผิดพลาด";

      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 md:px-8 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <i className="fa-solid fa-file-lines text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  ระบบติดตามหนังสือราชการภายใน
                </h1>
                <p className="text-blue-100 mt-1 text-sm">
                  กรอกข้อมูลเพื่อบันทึกและอัปโหลดไฟล์ลงในระบบ
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Section: ข้อมูลหนังสือ */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                  <i className="fa-solid fa-hashtag text-blue-600 text-lg"></i>
                  <h2 className="text-lg font-semibold text-slate-700">
                    ข้อมูลหนังสือ
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      เลขที่หนังสือ <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="docNum"
                      value={formData.docNum}
                      onChange={handleInputChange}
                      placeholder="เช่น 052/123"
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      วันที่หนังสือ <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      name="docDate"
                      value={formData.docDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: ผู้รับผิดชอบ */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                  <i className="fa-solid fa-users text-blue-600 text-lg"></i>
                  <h2 className="text-lg font-semibold text-slate-700">
                    ผู้รับผิดชอบ
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      หน่วยงาน / กลุ่มสาระ{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    >
                      <option value="">
                        — เลือกกลุ่มสาระ/ฝ่ายงาน —
                      </option>

                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ครู / ผู้รับผิดชอบ{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: รายละเอียด */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                  <i className="fa-solid fa-note-sticky text-blue-600 text-lg"></i>
                  <h2 className="text-lg font-semibold text-slate-700">
                    รายละเอียด
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      เรื่อง <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="ระบุหัวข้อเรื่องหนังสือ"
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        เบอร์โทร
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="0xx-xxx-xxxx"
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        สถานะ
                      </label>

                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      >
                        <option value="รอดำเนินการ">
                          ⏳ รอดำเนินการ
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      หมายเหตุ
                    </label>

                    <textarea
                      name="remark"
                      value={formData.remark}
                      onChange={handleInputChange}
                      placeholder="ระบุหมายเหตุ (ถ้ามี)"
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Section: แนบไฟล์ */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                  <i className="fa-solid fa-paperclip text-blue-600 text-lg"></i>
                  <h2 className="text-lg font-semibold text-slate-700">
                    แนบไฟล์
                  </h2>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDragAndDrop}
                  onClick={() =>
                    document.getElementById("fileInput")?.click()
                  }
                  className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className="space-y-3">
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-blue-500"></i>

                    <p className="text-slate-600 font-medium">
                      {fileName}
                    </p>
                  </div>

                  <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
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

                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}