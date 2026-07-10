// app/quizz/page.tsx

import Link from "next/link";
import { Camera, Layers, HelpCircle, ArrowRight, Star } from "lucide-react";

export default function QuizzSelectionPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Pusat Latihan & Kuis SIBI
        </h1>
        <p className="text-slate-500 text-lg">
          Uji kemampuan bahasa isyaratmu melalui berbagai mode interaktif di bawah ini.
        </p>
      </div>

      {/* Grid Mode Kuis */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: Deteksi Gerakan Kamera */}
        <Link href="/quizz/peragaan" className="group cursor-pointer">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <Camera size={28} />
              </div>
              
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mb-2">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <span className="ml-1 text-slate-400 font-normal">Praktik Langsung</span>
              </div>

              <h2 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                Tantangan Ekspresi Gerakan
              </h2>
              <p className="text-slate-500 mt-2.5 text-sm leading-relaxed">
                Peragakan langsung huruf atau kata yang muncul di layar menggunakan kamera perangkatmu. Sistem AI akan mendeteksi ketepatan gerakanmu secara real-time.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
              <span>Mulai Praktik</span>
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* CARD 2: Menyusun Kata dari Video */}
        <Link href="/quizz/susun-kata" className="group cursor-pointer">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <Layers size={28} />
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mb-2">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} className="text-slate-200" />
                <span className="ml-1 text-slate-400 font-normal">Analisis Visual</span>
              </div>

              <h2 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-teal-700 transition-colors">
                Susun Kata Isyarat
              </h2>
              <p className="text-slate-500 mt-2.5 text-sm leading-relaxed">
                Perhatikan baik-baik rekaman video isyarat yang tampil, lalu susunlah kembali potongan huruf atau kata yang diisyaratkan menjadi kalimat yang benar.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-teal-600 group-hover:text-teal-700">
              <span>Mulai Tebak</span>
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* CARD 3: Pilihan Ganda */}
        <Link href="/quizz/pilihan-ganda" className="group cursor-pointer">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <HelpCircle size={28} />
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mb-2">
                <Star size={12} fill="currentColor" />
                <Star size={12} className="text-slate-200" />
                <Star size={12} className="text-slate-200" />
                <span className="ml-1 text-slate-400 font-normal">Teori Dasar</span>
              </div>

              <h2 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors">
                Kuis Pilihan Ganda
              </h2>
              <p className="text-slate-500 mt-2.5 text-sm leading-relaxed">
                Uji pemahaman wawasan umum dan arti gerakan SIBI melalui pertanyaan pilihan ganda terstruktur. Sangat cocok untuk mengasah ingatan dasarmu.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              <span>Mulai Ujian</span>
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}