"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Info, Timer, CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw, HelpCircle } from "lucide-react";

interface PilihanOpsi {
  A: string;
  B: string;
  C: string;
  D: string;
}

interface SoalPilihanGanda {
  id: number;
  pertanyaan: string;
  video_url: string | null;
  pilihan: PilihanOpsi | string;
  jawaban_benar: string;
}

interface RekapKuis {
  pg_id: number;
  pertanyaan: string;
  jawaban_user: string; // Menggunakan format snake_case sesuai kebutuhan database API
  jawabanUserText: string; // Teks untuk tampilan evaluasi di client
  jawabanBenarText: string;
  isCorrect: boolean;
}

export default function PilihanGandaQuizzPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Manajemen Soal Terpilih (Kumpulan Soal Sesi Ini)
  const [poolSoal, setPoolSoal] = useState<SoalPilihanGanda[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State Pilihan & Jawaban User Terpilih per Soal (Array indeks 0-9)
  const [jawabanTerpilihSesi, setJawabanTerpilihSesi] = useState<(string | null)[]>(Array(10).fill(null));

  // State Manajemen Waktu
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mengambil user_id dari Session (Simulasi Session Storage)
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Menyamakan metode pembacaan dengan halaman peragaan yang berhasil
      const activeUser = localStorage.getItem("user");
      if (activeUser) {
        try {
          const parsedUser = JSON.parse(activeUser);
          if (parsedUser && parsedUser.id) {
            setUserId(Number(parsedUser.id));
            console.log("User ID untuk Pilihan Ganda berhasil dimuat:", parsedUser.id);
          }
        } catch (e) {
          console.error("Gagal membaca user id dari localStorage di Pilihan Ganda:", e);
        }
      }
    }
  }, []);

  // 1. Ambil Paket 10 Soal Sekaligus di Awal untuk Mendukung Navigasi Bolak-balik
  const fetchSemuaSoal = () => {
    setLoading(true);
    fetch(`${flaskUrl}/quizz/pilihan-ganda?limit=10`, {
      headers: {
        "ngrok-skip-browser-warning": "any-value"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setPoolSoal(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat soal pilihan ganda:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSemuaSoal();
  }, []);

  // 2. Fungsi Pengiriman Hasil Kuis ke Database API Flask
  const saveResultsToDatabase = async (finalRiwayat: RekapKuis[]) => {
    if (!userId) {
      console.log("User belum login (guest). Hasil kuis hanya ditampilkan tanpa disimpan ke database.");
      return;
    }

    try {
      const promises = finalRiwayat.map((item) => {
        return fetch(`${flaskUrl}/quizz/save/pilihan-ganda`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "any-value"
          },
          body: JSON.stringify({
            user_id: userId,
            pg_id: item.pg_id,
            jawaban_user: item.jawaban_user
          })
        });
      });
      await Promise.all(promises);
      console.log("Semua data kuis PG berhasil disimpan ke database.");
    } catch (err) {
      console.error("Terjadi kesalahan saat menyimpan kuis PG:", err);
    }
  };

  // 3. Fungsi Pembuat Struktur Evaluasi Akhir (Mendukung Pengisian Otomatis Soal Belum Terjawab)
  const generateFinalRiwayat = (currentJawaban: (string | null)[]) => {
    return poolSoal.map((soalItem, index) => {
      let parsedOpsis: PilihanOpsi | null = null;
      if (typeof soalItem.pilihan === "string") {
        try {
          parsedOpsis = JSON.parse(soalItem.pilihan);
        } catch {
          parsedOpsis = null;
        }
      } else {
        parsedOpsis = soalItem.pilihan;
      }

      const getOpsiText = (key: string) => {
        return parsedOpsis ? parsedOpsis[key as keyof PilihanOpsi] || key : key;
      };

      const userAnsKey = currentJawaban[index];
      const kunciBenar = soalItem.jawaban_benar.trim().toUpperCase();
      const isCorrect = userAnsKey !== null && userAnsKey === kunciBenar;

      let jawabanUserRaw = "-";
      let jawabanUserDisplay = "-";

      if (userAnsKey !== null) {
        jawabanUserRaw = userAnsKey;
        jawabanUserDisplay = `${userAnsKey}. ${getOpsiText(userAnsKey)}`;
      }

      return {
        pg_id: soalItem.id,
        pertanyaan: soalItem.pertanyaan,
        jawaban_user: jawabanUserRaw,
        jawabanUserText: jawabanUserDisplay,
        jawabanBenarText: `${kunciBenar}. ${getOpsiText(kunciBenar)}`,
        isCorrect: isCorrect,
      };
    });
  };

  // 4. Fungsi Mengakhiri Kuis (Selesai Manual / Waktu Habis)
  const handleFinishQuizz = (currentJawaban = jawabanTerpilihSesi) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsFinished(true);

    const finalRiwayat = generateFinalRiwayat(currentJawaban);
    saveResultsToDatabase(finalRiwayat);
  };

  // 5. Kontrol Interval Timer Kontinu
  useEffect(() => {
    if (hasStarted && !isFinished && !loading && poolSoal.length > 0) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleFinishQuizz();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasStarted, isFinished, loading, poolSoal, jawabanTerpilihSesi]);

  const handleResetQuizz = () => {
    setJawabanTerpilihSesi(Array(10).fill(null));
    setCurrentIndex(0);
    setTimeLeft(600);
    setIsFinished(false);
    setHasStarted(false);
    fetchSemuaSoal();
  };

  // Navigasi Soal
  const goToNextQuestion = () => {
    if (currentIndex < poolSoal.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handlePilihOpsi = (key: string) => {
    const updated = [...jawabanTerpilihSesi];
    updated[currentIndex] = key;
    setJawabanTerpilihSesi(updated);
  };

  const handleLewatiQuestion = () => {
    const updated = [...jawabanTerpilihSesi];
    updated[currentIndex] = null; // Menandai eksplisit dilewati
    setJawabanTerpilihSesi(updated);
    goToNextQuestion();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat rangkaian kuis pilihan ganda...</div>;
  if (poolSoal.length === 0) return <div className="p-8 text-center text-slate-500">Tidak ada soal yang tersedia di database.</div>;

  const soalAktif = poolSoal[currentIndex];
  let pilihanParsed: PilihanOpsi | null = null;
  if (typeof soalAktif?.pilihan === "string") {
    try {
      pilihanParsed = JSON.parse(soalAktif.pilihan);
    } catch {
      pilihanParsed = null;
    }
  } else {
    pilihanParsed = soalAktif?.pilihan || null;
  }

  const opsiKeys: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
  const riwayatEvaluasiTampilan = generateFinalRiwayat(jawabanTerpilihSesi);

  // ==========================================
  // VIEW: PANEL TAMPILAN REKAP HASIL KUIS
  // ==========================================
  if (isFinished) {
    const totalBenar = riwayatEvaluasiTampilan.filter((r) => r.isCorrect).length;
    const totalSoal = riwayatEvaluasiTampilan.length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-xl text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <HelpCircle size={40} className="animate-pulse" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kuis Selesai!</h1>
          <p className="text-slate-500 mt-2">Evaluasi pengerjaan Anda telah terekam secara komprehensif.</p>

          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-center">
              <span className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Benar</span>
              <span className="text-3xl font-black text-indigo-600 mt-1 block">{totalBenar}</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center">
              <span className="block text-xs font-bold text-rose-700 uppercase tracking-wider">Salah / Kosong</span>
              <span className="text-3xl font-black text-rose-600 mt-1 block">{totalSoal - totalBenar}</span>
            </div>
          </div>

          <div className="text-left mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Detail Evaluasi (Total {totalSoal} Soal)</h3>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {riwayatEvaluasiTampilan.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-slate-800 text-sm leading-tight">{idx + 1}. {item.pertanyaan}</span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full shrink-0">
                        <CheckCircle2 size={12} /> Benar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full shrink-0">
                        <XCircle size={12} /> {item.jawaban_user === "-" ? "Dilewati" : "Salah"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-0.5 pt-1 border-t border-slate-200/60">
                    <p className="text-slate-500">
                      Jawaban Anda: <span className={`font-semibold ${item.isCorrect ? "text-indigo-600" : "text-rose-600"}`}>{item.jawabanUserText}</span>
                    </p>
                    {!item.isCorrect && (
                      <p className="text-emerald-600 font-medium">Kunci Jawaban: {item.jawabanBenarText}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleResetQuizz}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
            >
              <RotateCcw size={18} />
              Coba Lagi
            </button>
            <Link
              href="/quizz"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl transition-all"
            >
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: HUB / TAMPILAN ATURAN AWAL SEBELUM MEMULAI KUIS
  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/quizz"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
          Kembali ke Pusat Kuis
        </Link>

        <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
            <HelpCircle size={32} />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Kuis Pilihan Ganda SIBI
          </h1>

          <p className="text-slate-500 text-lg leading-relaxed mb-8">
            Uji pemahaman teori dasar, aturan struktur tata bahasa SIBI, dan kosakata isyarat melalui pertanyaan pilihan ganda yang komprehensif.
          </p>

          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 text-left mb-8 flex gap-4 items-start">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800 leading-relaxed">
              <strong className="block mb-1">Aturan Bermain:</strong>
              Anda memiliki batas waktu <b>10 Menit</b> untuk memproses total <b>10 butir pertanyaan</b>. Jawaban dapat diubah kembali selama waktu masih tersedia.
            </div>
          </div>

          <button
            onClick={() => setHasStarted(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            Mulai Kuis Sekarang
          </button>
        </div>
      </div>
    );
  }

  const isSoalTerakhir = currentIndex === poolSoal.length - 1;
  const currentJawabanUser = jawabanTerpilihSesi[currentIndex];

  // ==========================================
  // VIEW: UTAMA INTERFACE SIMULASI SOAL KUIS
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Kontrol Kuis */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleFinishQuizz()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
          Akhiri Kuis Lebih Cepat
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Soal: {currentIndex + 1} / 10
          </span>
          <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full font-bold shadow-sm transition-all ${timeLeft <= 15
            ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
            : "bg-white border-slate-200 text-slate-700"
            }`}>
            <Timer size={16} />
            <span>Sisa Waktu: {timeLeft}s</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* KOLOM KIRI: Media Pemutar Video / Panel Teks Pertanyaan */}
        <div className="flex flex-col gap-4">
          {/* Main Pertanyaan */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[120px]">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
              Pertanyaan ke-{currentIndex + 1}
            </span>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-slate-100">
              {soalAktif?.pertanyaan}
            </h2>
          </div>

          {/* Player Video (Hanya muncul jika video_url tidak NULL) */}
          {soalAktif?.video_url && (
            <div className="bg-slate-950 p-3 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              <video
                src={`/video${soalAktif.video_url}`}
                autoPlay
                controls
                loop
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Opsi Jawaban Dinamis & Kontrol Tombol Navigasi Kondisional */}
        <div className="flex flex-col justify-between gap-6">
          <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col gap-3 flex-1 justify-center">
            {pilihanParsed ? (
              opsiKeys.map((key) => {
                const isSelected = currentJawabanUser === key;
                const textJawaban = pilihanParsed ? pilihanParsed[key] : "";

                return (
                  <button
                    key={key}
                    onClick={() => handlePilihOpsi(key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left font-semibold transition-all duration-200 active:scale-[0.99] ${isSelected
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      } cursor-pointer`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                      {key}
                    </span>
                    <span className="text-sm md:text-base leading-snug">{textJawaban}</span>
                  </button>
                );
              })
            ) : (
              <p className="text-slate-400 italic text-center text-sm">Gagal memuat opsi jawaban.</p>
            )}
          </div>

          {/* PANEL NAVIGASI STRUKTUR TOMBOL KONDISIONAL */}
          <div className="flex flex-wrap gap-4">
            {/* Tombol Kembali: Hanya muncul di Soal Nomor 2 sampai 10 (currentIndex > 0) */}
            {currentIndex > 0 && (
              <button
                onClick={goToPreviousQuestion}
                className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Kembali
              </button>
            )}

            {/* Jika BUKAN Soal Terakhir (Soal 1-9): Tampilkan Tombol Selanjutnya dan Lewati */}
            {!isSoalTerakhir ? (
              <>
                <button
                  onClick={goToNextQuestion}
                  disabled={!currentJawabanUser}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg enabled:hover:shadow-indigo-500/20 cursor-pointer"
                >
                  Selanjutnya
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={handleLewatiQuestion}
                  className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all cursor-pointer"
                >
                  Lewati
                </button>
              </>
            ) : (
              /* Jika DI SOAL TERAKHIR (Soal 10): Tombol Selanjutnya & Lewati Dihapus, Digantikan Tombol Selesai */
              <button
                onClick={() => handleFinishQuizz()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
              >
                Selesai & Kirim Hasil
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}