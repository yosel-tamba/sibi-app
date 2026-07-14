"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FlaskConical,
  Info,
  User,
  LogIn,
  LogOut,
  Menu,
  X
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userSession, setUserSession] = useState<{ id?: number; username?: string; email: string } | null>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const activeUser = localStorage.getItem("user");
    if (activeUser) {
      try {
        setUserSession(JSON.parse(activeUser));
      } catch (e) {
        console.error("Gagal membaca session", e);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUserSession(null);
    router.push("/");
  };

  const menuItems = [
    { name: "About", href: "/", icon: Info },
    { name: "Dictionary", href: "/dictionary", icon: BookOpen },
    { name: "Quizz", href: "/quizz", icon: HelpCircle },
    { name: "Testing", href: "/pengujian", icon: FlaskConical },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between py-8 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-100 to-green-300 bg-clip-text text-transparent tracking-wide">
          SIBI Learning
        </h2>
        <div className="h-[2px] w-12 bg-emerald-500/50 mx-auto mt-2 rounded-full"></div>
      </div>

      <nav className="space-y-2 my-auto">
        {menuItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-white text-emerald-900 font-bold shadow-md border-l-4 border-emerald-500 transform scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"
                }`}
            >
              <Icon
                size={22}
                className={`transition-transform group-hover:scale-110 ${isActive ? "text-emerald-600" : "text-emerald-200/80"
                  }`}
              />
              <span className="text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-emerald-700/40 pt-4">
        {userSession ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-800/40 rounded-xl border border-emerald-700/30">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-emerald-300 font-medium">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">
                  {userSession.username || userSession.email}
                </p>
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
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${pathname === "/login"
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
    <html lang="en">
      <body className={inter.className}>
        {isAuthPage ? (
          <main className="min-h-screen bg-slate-50 text-slate-900">{children}</main>
        ) : (
          <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">

            {/* SIDEBAR DESKTOP */}
            <aside className="hidden md:flex md:w-64 flex-col bg-gradient-to-b from-emerald-900 to-emerald-950 text-white shadow-xl flex-shrink-0">
              <SidebarContent />
            </aside>

            {/* AREA KONTEN UTAMA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

              {/* HEADER TOP BAR MOBILE */}
              <header className="md:hidden w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
                <h2 className="text-lg font-bold text-emerald-800">SIBI App</h2>
                <button
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                  className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </header>

              {/* MOBILE SIDEBAR OVERLAY */}
              {isMobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                  <div
                    className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <aside className="relative w-64 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex flex-col h-full shadow-2xl">
                    <div className="absolute top-4 right-4">
                      <button onClick={() => setIsMobileOpen(false)} className="text-emerald-200 hover:text-white p-1">
                        <X size={22} />
                      </button>
                    </div>
                    <SidebarContent />
                  </aside>
                </div>
              )}

              {/* MAIN CONTAINER KONTEN */}
              <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-green-100 to-emerald-100 relative">

                {/* Ornamen lingkaran dekoratif di belakang kaca */}
                <div className="absolute top-0 right-0 -z-10 w-80 h-80 bg-emerald-300 rounded-full blur-3xl opacity-60 pointer-events-none" />
                <div className="absolute bottom-10 left-10 -z-10 w-96 h-96 bg-green-300 rounded-full blur-3xl opacity-50 pointer-events-none" />

                {/* Lapisan Backdrop Blur Putih (Glassmorphism) yang membungkus konten */}
                <div className="min-h-full w-full bg-white/75 backdrop-blur-md p-4 md:p-8">
                  <div className="max-w-7xl mx-auto">
                    {children}
                  </div>
                </div>

              </main>
            </div>

          </div>
        )}
      </body>
    </html>
  );
}