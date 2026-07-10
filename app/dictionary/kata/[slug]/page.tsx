// app/dictionary/kata/[slug]/page.tsx
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DetailKataPage({
  params,
}: Props) {
  const { slug } = await params;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tombol Kembali ke Kamus Kata */}
      <Link 
        href="/dictionary/kata" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
        Kembali ke Kamus Kata
      </Link>

      {/* Grid Layout Card Utama */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-10 shadow-sm grid md:grid-cols-2 gap-8 items-center">
        
        {/* KOLOM KIRI: Bagian Teks & Informasi (Sekarang di dalam Card) */}
        <div className="flex flex-col items-start space-y-4 order-2 md:order-1">
          <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1 rounded-md text-xs font-semibold border border-teal-100">
            <Video size={14} />
            Peragaan Isyarat Visual
          </span>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight capitalize">
            Peragaan Kata "{slug}"
          </h1>

          <p className="text-slate-600 text-base md:text-lg leading-relaxed pt-2">
            Ikuti visualisasi gerakan kosakata bahasa isyarat di samping untuk kata{" "}
            <span className="font-extrabold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100/60 capitalize">
              {slug}
            </span>.
          </p>
        </div>

        {/* KOLOM KANAN: Bagian Video Player (Mepet Kanan) */}
        <div className="w-75 rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-900 flex items-center justify-end ml-auto order-1 md:order-2">
          <video
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-contain"
          >
            <source
              src={`/video/Kata/${slug}1.mp4`}
              type="video/mp4"
            />
            Browser kamu tidak mendukung pemutar video.
          </video>
        </div>

      </div>
    </div>
  );
}