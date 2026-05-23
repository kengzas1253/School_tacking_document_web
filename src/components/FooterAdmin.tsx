export function FooterAdmin() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-slate-200 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <i className="fa-solid fa-certificate text-white"></i>
            </div>
            <div>
              <p className="font-semibold text-white">
                ระบบรับ-ส่งหนังสือราชการ
              </p>
              <p className="text-xs text-slate-400">
                Government Document Tracking System
              </p>
            </div>
          </div>

          {/* Center Section - Divider */}
          <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>

          {/* Right Section */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <a
                href="http://www.sapa2.ac.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-300 hover:text-white transition-colors"
              >
                โรงเรียนสภาราชินี ๒
              </a>
              <p className="text-xs text-slate-500">Sappharachinee School 2</p>
            </div>
            <span className="text-slate-600">·</span>
            <div className="text-xs text-slate-400">
              <p>© 2026 All Rights Reserved</p>
              <p className="mt-1 text-slate-500">Version 1.0.0</p>
            </div>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
            {/* <p>Developed with <span className="text-red-500">♥</span> for Education</p> */}
            <a
              href="https://github.com/kengzas1253/School_tacking_document_web"
              target="_blank"
              rel="noopener noreferrer"
            >
              Developed with <span className="text-red-500">♥</span> for
              Education
            </a>
            <p className="mt-2 md:mt-0">Last Updated: May 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
