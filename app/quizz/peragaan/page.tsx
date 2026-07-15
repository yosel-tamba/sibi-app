"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, CheckCircle2, Play, Info, Timer, Award, XCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";

interface SoalPeragaan {
  id: number;
  instruksi: string;
  keyword: string;
}

interface RekapKuis {
  peragaan_id: number;
  keyword: string;
  jawaban_user: string;
  isCorrect: boolean;
}

export default function PeragaanQuizzPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soalList, setSoalList] = useState<SoalPeragaan[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<string>("Menunggu gerakan...");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isMatched, setIsMatched] = useState(false);

  // Buffer state untuk mengidentifikasi gerakan yang membutuhkan penggabungan suku kata/partisi
  const [variabel1, setVariabel1] = useState<string | null>(null);
  const [variabel2, setVariabel2] = useState<string | null>(null);

  // State Manajemen Kuis & Timer
  const [timeLeft, setTimeLeft] = useState(600);
  const [riwayat, setRiwayat] = useState<RekapKuis[]>([]);

  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Ambil ID dari localStorage saat halaman di-load
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const activeUser = localStorage.getItem("user");
    if (activeUser) {
      try {
        const parsedUser = JSON.parse(activeUser);
        if (parsedUser.id) {
          setUserId(Number(parsedUser.id));
        }
      } catch (e) {
        console.error("Gagal membaca user id dari session:", e);
      }
    }
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mengambil 10 soal acak sekaligus di awal agar navigasi (Next/Prev) stabil
  useEffect(() => {
    fetch(`${flaskUrl}/quizz/peragaan?limit=10`, {
      headers: {
        "ngrok-skip-browser-warning": "any-value"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setSoalList(data);
          const initialRiwayat = data.map((item: SoalPeragaan) => ({
            peragaan_id: item.id,
            keyword: item.keyword,
            jawaban_user: "-",
            isCorrect: false
          }));
          setRiwayat(initialRiwayat);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat kumpulan soal:", err);
        setLoading(false);
      });
  }, []);

  // Sinkronisasi status deteksi ketika indeks soal berubah
  useEffect(() => {
    if (soalList.length > 0 && riwayat.length > 0) {
      const currentSave = riwayat[currentIndex];
      
      // Reset buffer variabel sementara ketika berganti soal
      setVariabel1(null);
      setVariabel2(null);

      if (currentSave && currentSave.jawaban_user !== "-") {
        setPrediction(currentSave.jawaban_user);
        setIsMatched(currentSave.isCorrect);
        setConfidence(null);
      } else {
        setPrediction("Menunggu gerakan...");
        setIsMatched(false);
        setConfidence(null);
      }
    }
  }, [currentIndex, soalList, riwayat]);

  // Mengatur jalannya kamera dan waktu hitung mundur
  useEffect(() => {
    if (hasStarted && !isFinished && !loading && soalList.length > 0) {
      // Kamera hanya aktif jika soal saat ini belum dijawab dengan benar
      const currentSave = riwayat[currentIndex];
      if (!currentSave?.isCorrect) {
        startCamera();
      } else {
        stopCameraAndPrediction();
      }

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleFinishQuizz(true); // Kirim flag true menandakan waktu habis
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      stopCameraAndPrediction();
    };
  }, [hasStarted, isFinished, loading, currentIndex, soalList, riwayat]);

  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      intervalRef.current = setInterval(captureAndPredict, 1000);
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      setPrediction("Kamera tidak diizinkan atau tidak ditemukan.");
    }
  };

  const stopCameraAndPrediction = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Logika Penyimpanan Hasil ke Backend API
  const saveAllResultsToDatabase = async (finalRiwayat: RekapKuis[]) => {
    if (!userId) {
      console.log("User belum login (guest). Hasil kuis hanya ditampilkan di halaman rekap tanpa disimpan.");
      return;
    }

    try {
      const promises = finalRiwayat.map((item) => {
        return fetch(`${flaskUrl}/quizz/save/peragaan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "any-value"
          },
          body: JSON.stringify({
            user_id: userId,
            peragaan_id: item.peragaan_id,
            jawaban_user: item.jawaban_user
          })
        });
      });
      await Promise.all(promises);
      console.log("Semua data kuis berhasil disimpan ke database.");
    } catch (err) {
      console.error("Terjadi kesalahan saat menyimpan data kuis:", err);
    }
  };

  // Menambahkan parameter optional targetRiwayat untuk menangkap state terbaru dari handleNextQuestion
  const handleFinishQuizz = (isTimeOut = false, targetRiwayat?: RekapKuis[]) => {
    stopCameraAndPrediction();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Gunakan array penampung dari parameter jika ada, jika tidak gunakan state riwayat saat ini
    let finalRiwayat = targetRiwayat ? [...targetRiwayat] : [...riwayat];

    // Proses pembersihan data riwayat untuk memastikan soal yang belum benar tetap "-"
    finalRiwayat = finalRiwayat.map((item, idx) => {
      // Jika dipicu karena waktu habis, kelola soal yang sedang aktif saat ini
      if (isTimeOut && idx === currentIndex) {
        return {
          ...item,
          jawaban_user: isMatched ? item.keyword : "-",
          isCorrect: isMatched
        };
      }

      // Untuk semua soal lainnya yang belum berhasil dijawab dengan benar, pastikan nilainya "-"
      if (!item.isCorrect) {
        return {
          ...item,
          jawaban_user: "-",
          isCorrect: false
        };
      }
      return item;
    });

    setRiwayat(finalRiwayat);
    setIsFinished(true);
    saveAllResultsToDatabase(finalRiwayat);
  };

  const handleNextQuestion = (wasSkipped = false) => {
    const updatedRiwayat = [...riwayat];
    const currentSoal = soalList[currentIndex];

    if (wasSkipped) {
      updatedRiwayat[currentIndex] = {
        peragaan_id: currentSoal.id,
        keyword: currentSoal.keyword,
        jawaban_user: "-", 
        isCorrect: false
      };
    } else {
      updatedRiwayat[currentIndex] = {
        peragaan_id: currentSoal.id,
        keyword: currentSoal.keyword,
        jawaban_user: isMatched ? currentSoal.keyword : "-",
        isCorrect: isMatched
      };
    }

    setRiwayat(updatedRiwayat);

    if (currentIndex < soalList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuizz(false, updatedRiwayat); // Kirim riwayat terbaru agar langsung disimpan dengan benar
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleResetQuizz = () => {
    setLoading(true);
    setTimeLeft(600);
    setCurrentIndex(0);
    setIsFinished(false);
    setHasStarted(false);
    setIsMatched(false);
    setPrediction("Menunggu gerakan...");
    setConfidence(null);
    setVariabel1(null);
    setVariabel2(null);

    fetch(`${flaskUrl}/quizz/peragaan?limit=10`, {
      headers: {
        "ngrok-skip-browser-warning": "any-value"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setSoalList(data);
          const initialRiwayat = data.map((item: SoalPeragaan) => ({
            peragaan_id: item.id,
            keyword: item.keyword,
            jawaban_user: "-",
            isCorrect: false
          }));
          setRiwayat(initialRiwayat);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat ulang soal:", err);
        setLoading(false);
      });
  };

  const captureAndPredict = async () => {
    if (!videoRef.current || isMatched || isFinished) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const response = await fetch(`${flaskUrl}/predict`, {
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "any-value"
          },
          body: formData,
        });
        const data = await response.json();

        if (data.class) {
          const detectedClass = data.class;
          setConfidence(data.confidence);

          // Gunakan Regular Expression untuk mengecek akhiran angka 1, 2, atau 3 (untuk Cepat3)
          const endsWithNumberMatch = detectedClass.match(/^(.*?)([1-3])$/);

          if (endsWithNumberMatch) {
            const wordBase = endsWithNumberMatch[1]; // Suku kata dasar (misal: "Apa" dari "Apa1")
            const numberSuffix = endsWithNumberMatch[2]; // Angka akhiran ("1", "2", atau "3")

            let currentV1 = variabel1;
            let currentV2 = variabel2;

            if (numberSuffix === "1") {
              setVariabel1(wordBase);
              currentV1 = wordBase;
            } else if (numberSuffix === "2" || numberSuffix === "3") {
              setVariabel2(wordBase);
              currentV2 = wordBase;
            }

            // Jika kedua variabel sementara sudah terisi dan memiliki kata dasar yang cocok/sama
            if (currentV1 && currentV2 && currentV1.toLowerCase() === currentV2.toLowerCase()) {
              const finalMergedWord = currentV1; // Kata gabungan bersih tanpa angka (misal: "Apa")

              setPrediction(finalMergedWord);

              // Reset buffer penampung
              setVariabel1(null);
              setVariabel2(null);

              // Validasi kecocokan dengan keyword soal
              if (finalMergedWord.toLowerCase() === soalList[currentIndex]?.keyword.toLowerCase()) {
                setIsMatched(true);

                setRiwayat((prev) => {
                  const newRiwayat = [...prev];
                  newRiwayat[currentIndex] = {
                    peragaan_id: soalList[currentIndex].id,
                    keyword: soalList[currentIndex].keyword,
                    jawaban_user: soalList[currentIndex].keyword,
                    isCorrect: true
                  };
                  return newRiwayat;
                });
              }
            }
          } else {
            // Jika kelas murni kata dasar yang tidak diakhiri angka (misal: "Saya", "Makan")
            setPrediction(detectedClass);
            
            // Set variabel penampung kembali ke null karena gerakan non-angka bersifat mandiri
            setVariabel1(null);
            setVariabel2(null);

            if (detectedClass.toLowerCase() === soalList[currentIndex]?.keyword.toLowerCase()) {
              setIsMatched(true);

              setRiwayat((prev) => {
                const newRiwayat = [...prev];
                newRiwayat[currentIndex] = {
                  peragaan_id: soalList[currentIndex].id,
                  keyword: soalList[currentIndex].keyword,
                  jawaban_user: soalList[currentIndex].keyword,
                  isCorrect: true
                };
                return newRiwayat;
              });
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengirim prediksi:", err);
      }
    }, "image/jpeg");
  };

  const soal = soalList[currentIndex];

  // ==========================================
  // TAMPILAN AKHIR: HASIL KUIS
  // ==========================================
  if (isFinished) {
    const totalBenar = riwayat.filter((r) => r.isCorrect).length;
    const totalSoal = riwayat.length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-xl text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Award size={44} className="animate-pulse" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kuis Selesai!</h1>
          <p className="text-slate-500 mt-2">Anda telah menyelesaikan sesi tantangan gerakan.</p>

          {/* Kartu Skor */}
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center">
              <span className="block text-xs font-bold text-emerald-700 uppercase tracking-wider">Benar</span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">{totalBenar}</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center">
              <span className="block text-xs font-bold text-rose-700 uppercase tracking-wider">Salah / Dilewati</span>
              <span className="text-3xl font-black text-rose-600 mt-1 block">{totalSoal - totalBenar}</span>
            </div>
          </div>

          {/* Rekapitulasi Daftar Jawaban */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Detail Performa Gerakan</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {riwayat.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <span className="font-semibold text-slate-800 capitalize block">{idx + 1}. {item.keyword}</span>
                    <span className="text-xs text-slate-400">Jawaban: <span className="uppercase font-medium text-slate-600">{item.jawaban_user}</span></span>
                  </div>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} /> Tepat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full">
                      <XCircle size={14} /> Kurang Tepat
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleResetQuizz}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
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

  // Tampilan Sebelum Kuis Dimulai (Start Section)
  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/quizz"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
          Kembali ke Pusat Kuis
        </Link>

        <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <Camera size={32} />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Tantangan Ekspresi Gerakan SIBI
          </h1>

          <p className="text-slate-500 text-lg leading-relaxed mb-8">
            Peragakan kata isyarat SIBI di depan kamera berdasarkan instruksi yang diberikan. Sistem AI akan memvalidasi ketepatan struktur gerakan Anda secara langsung.
          </p>

          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 text-left mb-8 flex gap-4 items-start">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800 leading-relaxed">
              <strong className="block mb-1">Aturan Bermain:</strong>
              Anda memiliki waktu <b>10 Menit</b> untuk menyelesaikan <b>10 tantangan</b>. Jawab dengan tepat sebelum menekan tombol selanjutnya untuk mengumpulkan skor terbaik!
            </div>
          </div>

          <button
            onClick={() => setHasStarted(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            Mulai Kuis Sekarang
          </button>
        </div>
      </div>
    );
  }

  if (loading || soalList.length === 0) return <div className="p-8 text-center text-slate-500">Memuat tantangan...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Stat Kontrol */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleFinishQuizz(false)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
          Akhiri Kuis Lebih Cepat
        </button>

        <div className="flex items-center gap-4">
          {/* Progress Indikator Soal */}
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Soal: {currentIndex + 1} / 10
          </span>
          {/* Timer UI Component */}
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

        {/* KOLOM KIRI: Web Cam Feed */}
        <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center border border-slate-800 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          {(!streamRef.current) && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Camera size={48} className="opacity-50" />
              <p className="text-sm">{isMatched ? "Deteksi terjeda karena jawaban sudah benar" : "Menyalakan kamera..."}</p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Instruksi & Status */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm relative overflow-hidden">
            {isMatched && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
            )}

            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Tantangan Sekarang
            </h2>
            <h1 className="text-4xl font-extrabold text-slate-950 mb-4 capitalize">
              {soal?.keyword}
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              {soal?.instruksi}
            </p>

            {/* Area Hasil Prediksi */}
            <div className={`rounded-2xl p-6 border transition-all duration-300 flex items-center justify-between ${isMatched
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-slate-50 border-slate-100 text-slate-800"
              }`}>
              <div>
                <p className={`text-sm font-medium ${isMatched ? "text-emerald-600" : "text-slate-400"}`}>
                  Hasil Deteksi AI:
                </p>
                <p className="text-2xl font-black mt-1 tracking-tight uppercase">
                  {prediction}
                </p>
                {confidence !== null && !isMatched && (
                  <p className="text-xs font-semibold opacity-60 mt-0.5">
                    Tingkat Akurasi: {(confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                {isMatched ? (
                  <CheckCircle2 size={32} className="text-emerald-600" />
                ) : (
                  <RefreshCw size={22} className="text-slate-400 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Tombol Kembali: Muncul di nomor soal 2 sampai 10 (index > 0) */}
            {currentIndex > 0 && (
              <button
                onClick={handlePrevQuestion}
                className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Sebelumnya
              </button>
            )}

            {/* Tombol Utama (Selanjutnya / Selesai) */}
            {currentIndex < soalList.length - 1 ? (
              <>
                <button
                  onClick={() => handleNextQuestion(false)}
                  disabled={!isMatched}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Selanjutnya
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => handleNextQuestion(true)}
                  className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all cursor-pointer"
                >
                  Lewati
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNextQuestion(false)}
                disabled={!isMatched}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Selesai & Simpan
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}