// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  AlertCircle
} from "lucide-react";

export default function AboutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="space-y-24 py-6 animate-in fade-in duration-500">

      {/* SECTION 1: HERO (Pengenalan SIBI & Visi Aksesibilitas) */}
      <section className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-emerald-100">
            <GraduationCap size={16} />
            Edukasi Bahasa Isyarat Indonesia
          </div>

          <h1 className="mt-6 text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            Mengenal Lebih Dekat
            <span className="text-emerald-600 block mt-2">Sistem Isyarat Bahasa Indonesia</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-600 leading-relaxed">
            Selamat datang di platform pembelajaran SIBI. Di sini, kami berkomunikasi,
            belajar, dan mendalami tata bahasa isyarat yang terstruktur untuk menjembatani
            interaksi dan memperluas inklusivitas di lingkungan masyarakat.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/quizz">
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/10 transition-all transform hover:-translate-y-0.5 cursor-pointer">
                Mulai Latihan
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>

        {/* Hero Side Graphic: Kotak Edukasi / Quote Penting */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <MessageSquare size={40} className="text-emerald-300 opacity-80 mb-6" />
          <h3 className="text-xl font-bold tracking-tight">"Bahasa isyarat bukan sekadar gerakan tangan, melainkan ekspresi pemikiran yang utuh."</h3>
          <p className="mt-4 text-emerald-100/80 text-sm leading-relaxed">
            Melalui pemahaman SIBI yang baik, kita mendukung standarisasi komunikasi formal yang inklusif baik di ranah pendidikan maupun instansi resmi.
          </p>
          <div className="mt-6 pt-6 border-t border-emerald-700/50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-200 font-medium uppercase tracking-wider">Kurikulum Resmi SIBI</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: PERBEDAAN SIBI & BISINDO (Tabel / Komparasi Kontras) */}
      <section className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Apa Perbedaan SIBI dan BISINDO?
          </h2>
          <p className="mt-3 text-slate-500 text-sm md:text-base">
            Seringkali masyarakat umum menganggap semua bahasa isyarat itu sama. Yuk, pahami karakteristik mendasar dari keduanya agar tidak keliru.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Blok SIBI */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-sm">SIBI</span>
              <h3 className="text-xl font-bold text-slate-900">Sistem Isyarat Bahasa Indonesia</h3>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Merupakan sistem isyarat yang dibentuk oleh pemerintah untuk kepentingan formal. SIBI mengadopsi tata bahasa lisan Indonesia secara mutlak, termasuk penggunaan awalan dan akhiran (imbuhan).
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><b>Penggunaan Resmi:</b> Digunakan di sekolah luar biasa (SLB) dan dokumentasi kenegaraan.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><b>Struktur Kosakata:</b> Lebih kompleks karena merepresentasikan kata berimbuhan secara detail.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><b>Sifat Gerakan:</b> Umumnya menggunakan satu tangan utama untuk mengeja abjad dasar.</span>
              </li>
            </ul>
          </div>

          {/* Blok BISINDO */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="bg-slate-600 text-white font-bold px-3 py-1 rounded-lg text-sm">BISINDO</span>
              <h3 className="text-xl font-bold text-slate-900">Bahasa Isyarat Indonesia</h3>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Merupakan bahasa isyarat alami yang lahir, tumbuh, dan digunakan secara praktis oleh komunitas Tuli di Indonesia dalam kehidupan sehari-hari. Lebih merujuk pada budaya asli komunitas terkait.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <span><b>Penggunaan Alami:</b> Sangat populer untuk komunikasi kasual, diskusi, dan bersosialisasi sehari-hari.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <span><b>Struktur Kosakata:</b> Lebih praktis, mengutamakan penyampaian makna inti kalimat secara efisien.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <span><b>Sifat Gerakan:</b> Kerap melibatkan penggunaan dua tangan serta ekspresi wajah yang sangat aktif.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: MENGAPA HARUS BELAJAR SIBI (Grid 3 Kolom Modern) */}
      <section className="space-y-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Mengapa Mempelajari SIBI Sangat Penting?
          </h2>
          <p className="mt-2 text-slate-500 text-sm md:text-base">
            Memiliki wawasan dasar mengenai SIBI membuka banyak peluang kebaikan untuk diri sendiri dan lingkungan sekitar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/80 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-xl">
              <Layers size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">Mendukung Pendidikan Formal</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Karena SIBI merupakan materi standardisasi dalam kurikulum SLB, mempelajarinya membantu menyelaraskan sistem edukasi nasional yang ramah disabilitas.
            </p>
          </div>

          <div className="bg-white/80 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-xl">
              <BookOpen size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">Memperkaya Tata Bahasa</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Struktur SIBI sejalan dengan PUEBI (Pedoman Umum Ejaan Bahasa Indonesia), melatih kita menyampaikan pesan isyarat dengan struktur kalimat baku yang rapi.
            </p>
          </div>

          <div className="bg-white/80 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-xl">
              <HelpCircle size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">Membangun Empati Tinggi</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Belajar isyarat menumbuhkan rasa kepedulian sosial yang nyata, meruntuhkan batasan interaksi, dan menjadikan kita pribadi yang lebih inklusif.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}