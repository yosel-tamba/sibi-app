"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Info, 
  User, 
  LogIn, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk responsivitas mobile menu dan data session user
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userSession, setUserSession] = useState<{ username: string } | null>(null);

  // Cek session user saat komponen dimuat
  useEffect(() => {
    const activeUser = localStorage.getItem("user");
    if (activeUser) {
      try {
        setUserSession(JSON.parse(activeUser));
      } catch (e) {
        console.error("Gagal membaca session", e);
      }
    }
  }, [pathname]); // Refresh cek setiap kali pindah halaman

  // Fungsi Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUserSession(null);
    router.push("/login");
  };

  // List Menu Navigasi Sidebar
  const menuItems = [
    { name: "SibiApp", href: "/dashboard", icon: Sparkles },
    { name: "Dictionary", href: "/dictionary", icon: BookOpen },
    { name: "Quizz", href: "/quizz", icon: HelpCircle },
    { name: "About", href: "/about", icon: Info },
  ];

  // Komponen Isi Navigasi Utama (Dipisah agar bisa dipakai ulang di Desktop & Mobile)
  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between py-8 px-4">
      {/* Bagian Atas: Logo / Nama Aplikasi */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-100 to-green-300 bg-clip-text text-transparent tracking-wide">
          SIBI Learning
        </h2>
        <div className="h-[2px] w-12 bg-emerald-500/50 mx-auto mt-2 rounded-full"></div>
      </div>

      {/* Bagian Tengah secara Vertikal: Menu Navigasi Utama */}
      <nav className="space-y-2 my-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-white text-emerald-900 font-bold shadow-md border-l-4 border-emerald-500 transform scale-[1.02]"
                  : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
              }`}
            >
              <Icon 
                size={22} 
                className={`transition-transform group-hover:scale-110 ${
                  isActive ? "text-emerald-600" : "text-emerald-200/80"
                }`} 
              />
              <span className="text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bagian Bawah: Kondisional Tombol LogIn / Profil User */}
      <div className="border-t border-emerald-700/40 pt-4">
        {userSession ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-800/40 rounded-xl border border-emerald-700/30">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-emerald-300 font-medium">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{userSession.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-200 hover:bg-red-900/30 hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
              pathname === "/login"
                ? "bg-white text-emerald-900 font-bold shadow-md"
                : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
            }`}
          >
            <LogIn size={22} />
            <span className="text-sm tracking-wide">Login / Register</span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/40">
      
      {/* 1. SIDEBAR UNTUK VERSI DESKTOP (Hidden di Mobile, Visible di md:flex) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-gradient-to-b from-emerald-900 to-emerald-950 text-white shadow-xl flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* 2. HEADER TOP BAR UNTUK MOBILE MENU */}
        <header className="md:hidden w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
          <h2 className="text-lg font-bold text-emerald-800">SIBI App</h2>
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* 3. MOBILE SIDEBAR OVERLAY (Laci menu saat diklik di HP/Tablet) */}
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Gelap Belakang Menu */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Wadah Menu Terbuka */}
            <aside className="relative w-64 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="absolute top-4 right-4">
                <button onClick={() => setIsMobileOpen(false)} className="text-emerald-200 hover:text-white p-1">
                  <X size={22} />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* 4. MAIN CONTAINER (Konten anak halaman bisa scroll mandiri) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Ornamen latar belakang abstrak agar layout tidak sepi/polos */}
          <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 -z-10 w-96 h-96 bg-green-300/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}