// app/dictionary/page.tsx
import Link from "next/link";
import { BookOpen, Languages, ArrowRight } from "lucide-react";

export default function PustakaIsyaratPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Kamus Isyarat SIBI
        </h1>
        <p className="text-slate-500 text-lg">
          Telusuri dan pelajari visualisasi gerakan bahasa isyarat secara instan.
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Abjad Isyarat */}
        <Link href="/dictionary/abjad" className="group cursor-pointer">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <BookOpen size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                Abjad Jari (Fingerspelling)
              </h2>
              <p className="text-slate-500 mt-2.5 leading-relaxed">
                Lihat peragaan visual ejaan huruf bahasa isyarat dari A sampai Y.
              </p>
            </div>
            
            <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
              Buka Kamus Abjad
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Card 2: Kosakata Isyarat */}
        <Link href="/dictionary/kata" className="group cursor-pointer">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <Languages size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-teal-700 transition-colors">
                Kosakata Harian
              </h2>
              <p className="text-slate-500 mt-2.5 leading-relaxed">
                Lihat peragaan gerakan kata dasar dan percakapan praktis sehari-hari.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-teal-600 group-hover:text-teal-700">
              Buka Kamus Kata
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}