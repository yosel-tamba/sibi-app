// app/dictionary/abjad/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const huruf = "ABCDEFGHIJKLMNOPQRSTUVWXY".split("");

export default function AbjadKamusPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Tombol Kembali ke Menu Utama Kamus */}
      <Link 
        href="/dictionary" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
        Kembali ke Pustaka Kamus
      </Link>

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Kamus Abjad Jari SIBI
        </h1>
        <p className="text-slate-500 text-lg">
          Pilih salah satu huruf untuk melihat peragaan isyarat visualnya.
        </p>
      </div>

      {/* Grid Letters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {huruf.map((item) => (
          <Link
            key={item}
            href={`/dictionary/abjad/${item.toLowerCase()}`}
            className="group cursor-pointer"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Efek hiasan background kecil saat di-hover */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              
              <h2 className="text-4xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors duration-200">
                {item}
              </h2>
              
              <span className="text-xs font-medium text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Lihat Isyarat
              </span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}