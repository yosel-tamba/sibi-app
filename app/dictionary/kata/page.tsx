// app/dictionary/kata/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const daftarKata = [
  "air", "anak", "apa", "bagaimana", "bangun", "besok", "bicara", "bisa", "cepat", "datang",
  "dengar", "dia", "guru", "jalan", "kamu", "kapan", "kemarin", "kerja", "kita", "lambat",
  "lelah", "lihat", "maaf", "main", "makan", "malam", "mana", "marah", "mau", "mereka",
  "minum", "nama", "nanti", "orang", "pagi", "pergi", "rumah", "sakit", "saya", "sedih",
  "sekarang", "sekolah", "senang", "siapa", "sudah", "tahu", "teman", "tidak", "tidur", "tua"
];

export default function KataKamusPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Tombol Kembali ke Menu Utama Pustaka */}
      <Link 
        href="/dictionary" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
        Kembali ke Pustaka Kamus
      </Link>

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Kamus Kosakata SIBI
        </h1>
        <p className="text-slate-500 text-lg">
          Pilih salah satu kata di bawah ini untuk melihat peragaan gerakan isyaratnya.
        </p>
      </div>

      {/* Grid Kata */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {daftarKata.map((kata) => (
          <Link
            key={kata}
            href={`/dictionary/kata/${kata.toLowerCase()}`}
            className="group cursor-pointer"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Efek garis bawah hiasan warna teal saat di-hover */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              
              <h2 className="text-base md:text-lg font-bold capitalize text-slate-800 group-hover:text-teal-600 transition-colors duration-200">
                {kata}
              </h2>
              
              <span className="text-[10px] font-semibold text-slate-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 tracking-wider uppercase">
                Lihat Video
              </span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}