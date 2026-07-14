"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Info, Timer, Award, CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw, Layers } from "lucide-react";

interface SoalSusunKata {
    id: number;
    video_url: string[];
    pilihan_kata: string[];
    jawaban_benar: string;
}

interface RekapKuis {
    id_soal: number;
    keyword: string;
    jawabanUser: string;
    isCorrect: boolean;
    kataTerpilihState: string[]; // Menyimpan state kata terpilih untuk fitur 'Kembali'
    opsiKataState: string[];     // Menyimpan urutan acak opsi kata untuk fitur 'Kembali'
}

export default function SusunKataQuizzPage() {
    const [hasStarted, setHasStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Kumpulan 10 soal yang dimuat sekaligus di awal agar navigasi bolak-balik aman
    const [daftarSoal, setDaftarSoal] = useState<SoalSusunKata[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // State manajemen susunan kata untuk SOAL AKTIF
    const [kataTerpilih, setKataTerpilih] = useState<string[]>([]);
    const [opsiKata, setOpsiKata] = useState<string[]>([]);

    // State Manajemen Kuis & Timer
    const [timeLeft, setTimeLeft] = useState(600);
    const [riwayat, setRiwayat] = useState<RekapKuis[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const activeUser = localStorage.getItem("user");
            if (activeUser) {
                try {
                    const parsedUser = JSON.parse(activeUser);
                    if (parsedUser && parsedUser.id) {
                        setUserId(Number(parsedUser.id));
                        console.log("User ID untuk Susun Kata berhasil dimuat:", parsedUser.id);
                    }
                } catch (e) {
                    console.error("Gagal membaca user id dari localStorage di Susun Kata:", e);
                }
            }
        }
    }, []);

    // Fungsi Pembantu untuk Mengacak Array
    const shuffleArray = (array: string[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // 1. Load 10 soal sekaligus dari backend di awal kuis
    const initKuis = () => {
        setLoading(true);
        fetch(`${flaskUrl}/quizz/susun-kata?limit=10`, {
            headers: {
                "ngrok-skip-browser-warning": "any-value"
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.length > 0) {
                    const formatData = data.map((item: any) => {
                        let parsedVideoUrl: string[] = [];
                        if (typeof item.video_url === "string") {
                            try {
                                parsedVideoUrl = JSON.parse(item.video_url);
                            } catch (e) {
                                parsedVideoUrl = [item.video_url];
                            }
                        } else if (Array.isArray(item.video_url)) {
                            parsedVideoUrl = item.video_url;
                        }
                        return { ...item, video_url: parsedVideoUrl };
                    });

                    setDaftarSoal(formatData);
                    setCurrentIndex(0);

                    setKataTerpilih([]);
                    setOpsiKata(shuffleArray(formatData[0].pilihan_kata || []));
                    setRiwayat([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Gagal memuat kuis:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        initKuis();
    }, []);

    // 2. Efek untuk menghandle jalannya timer
    useEffect(() => {
        if (hasStarted && !isFinished && !loading && daftarSoal.length > 0) {
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            handleTimeout();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        }

        return () => {
            if (isFinished && timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [hasStarted, isFinished, loading, daftarSoal]);

    // Sinkronisasi data saat Waktu Habis (Semua soal yang belum diisi otomatis dilewati)
    const handleTimeout = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Ambil riwayat saat ini, dan simpan jawaban aktif jika ada input terisi
        let finalRiwayat = [...riwayat];
        const soalAktif = daftarSoal[currentIndex];

        if (soalAktif && finalRiwayat.length === currentIndex) {
            const susunanUser = kataTerpilih.join(" ");
            const isCorrect = susunanUser.trim().toLowerCase() === soalAktif.jawaban_benar.trim().toLowerCase();
            finalRiwayat.push({
                id_soal: soalAktif.id,
                keyword: soalAktif.jawaban_benar,
                jawabanUser: susunanUser.trim() ? susunanUser : "(Dilewati)",
                isCorrect: susunanUser.trim() ? isCorrect : false,
                kataTerpilihState: kataTerpilih,
                opsiKataState: opsiKata
            });
        }

        // Isi sisa soal yang belum sempat disentuh user dengan status dilewati
        for (let i = finalRiwayat.length; i < daftarSoal.length; i++) {
            finalRiwayat.push({
                id_soal: daftarSoal[i].id,
                keyword: daftarSoal[i].jawaban_benar,
                jawabanUser: "(Dilewati)",
                isCorrect: false,
                kataTerpilihState: [],
                opsiKataState: daftarSoal[i].pilihan_kata || []
            });
        }

        setRiwayat(finalRiwayat);
        setIsFinished(true);
        saveKuisToDatabase(finalRiwayat);
    };

    // Fungsi Pengiriman ke Database Flask secara Batch menggunakan Promise.all
    const saveKuisToDatabase = async (finalRiwayat: RekapKuis[]) => {
        if (!userId) {
            console.log("User belum login (Session ID Kosong). Hasil tidak disimpan ke database.");
            return;
        }

        try {
            const requests = finalRiwayat.map((item) => {
                return fetch(`${flaskUrl}/quizz/save/susun-kata`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "any-value"
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        susunkata_id: item.id_soal,
                        jawaban_user: item.jawabanUser
                    })
                });
            });

            await Promise.all(requests);
            console.log("Seluruh data batch kuis susun kata berhasil disimpan!");
        } catch (error) {
            console.error("Gagal mengirim data kuis ke server:", error);
        }
    };

    // Aksi manual menekan tombol Selesai di slide terakhir
    const handleSelesaiKuis = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const soalAktif = daftarSoal[currentIndex];
        const susunanUser = kataTerpilih.join(" ");
        const isCorrect = susunanUser.trim().toLowerCase() === soalAktif.jawaban_benar.trim().toLowerCase();

        const finalRiwayat = [...riwayat];
        finalRiwayat[currentIndex] = {
            id_soal: soalAktif.id,
            keyword: soalAktif.jawaban_benar,
            jawabanUser: susunanUser.trim() ? susunanUser : "(Kosong)",
            isCorrect: isCorrect,
            kataTerpilihState: kataTerpilih,
            opsiKataState: opsiKata
        };

        setRiwayat(finalRiwayat);
        setIsFinished(true);
        saveKuisToDatabase(finalRiwayat);
    };

    // Tombol Selanjutnya / Lewati
    const handleNextQuestion = (wasSkipped = false) => {
        const soalAktif = daftarSoal[currentIndex];
        const susunanUser = kataTerpilih.join(" ");
        const isCorrect = wasSkipped ? false : susunanUser.trim().toLowerCase() === soalAktif.jawaban_benar.trim().toLowerCase();

        const updatedRiwayat = [...riwayat];
        updatedRiwayat[currentIndex] = {
            id_soal: soalAktif.id,
            keyword: soalAktif.jawaban_benar,
            jawabanUser: wasSkipped ? "(Dilewati)" : susunanUser || "(Kosong)",
            isCorrect: isCorrect,
            kataTerpilihState: kataTerpilih,
            opsiKataState: opsiKata
        };

        setRiwayat(updatedRiwayat);

        // Pindah ke slide berikutnya
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);

        // Jika soal berikutnya sudah pernah diisi sebelumnya (melalui tombol kembali), restore statenya
        if (updatedRiwayat[nextIdx]) {
            setKataTerpilih(updatedRiwayat[nextIdx].kataTerpilihState);
            setOpsiKata(updatedRiwayat[nextIdx].opsiKataState);
        } else {
            setKataTerpilih([]);
            setOpsiKata(shuffleArray(daftarSoal[nextIdx].pilihan_kata || []));
        }
    };

    // Tombol Kembali Ke Soal Sebelumnya
    const handlePrevQuestion = () => {
        if (currentIndex === 0) return;

        // Simpan terlebih dahulu pekerjaan saat ini sebelum mundur agar tidak hilang jika balik lagi
        const updatedRiwayat = [...riwayat];
        updatedRiwayat[currentIndex] = {
            id_soal: daftarSoal[currentIndex].id,
            keyword: daftarSoal[currentIndex].jawaban_benar,
            jawabanUser: kataTerpilih.join(" ") || "(Kosong)",
            isCorrect: kataTerpilih.join(" ").trim().toLowerCase() === daftarSoal[currentIndex].jawaban_benar.trim().toLowerCase(),
            kataTerpilihState: kataTerpilih,
            opsiKataState: opsiKata
        };
        setRiwayat(updatedRiwayat);

        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx);

        // Load data state dari memori riwayat indeks sebelumnya
        if (updatedRiwayat[prevIdx]) {
            setKataTerpilih(updatedRiwayat[prevIdx].kataTerpilihState);
            setOpsiKata(updatedRiwayat[prevIdx].opsiKataState);
        }
    };

    const handleResetQuizz = () => {
        setTimeLeft(600);
        setIsFinished(false);
        setHasStarted(false);
        initKuis();
    };

    // Fungsi interaksi klik kata
    const handlePilihKata = (kata: string) => {
        setKataTerpilih([...kataTerpilih, kata]);
        setOpsiKata(opsiKata.filter((k) => k !== kata));
    };

    // Fungsi membatalkan kata
    const handleBatalKata = (kata: string) => {
        setOpsiKata([...opsiKata, kata]);
        setKataTerpilih(kataTerpilih.filter((k) => k !== kata));
    };

    const soal = daftarSoal[currentIndex];

    // ==========================================
    // TAMPILAN AKHIR: HASIL KUIS
    // ==========================================
    if (isFinished) {
        const totalBenar = riwayat.filter((r) => r.isCorrect).length;
        const totalSoal = riwayat.length;


        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-xl text-center">
                    <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Layers size={40} className="animate-pulse" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kuis Selesai!</h1>
                    <p className="text-slate-500 mt-2">Anda telah menyelesaikan sesi analisis visual susun kata.</p>

                    <div className="grid grid-cols-2 gap-4 my-8">
                        <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 text-center">
                            <span className="block text-xs font-bold text-teal-700 uppercase tracking-wider">Benar</span>
                            <span className="text-3xl font-black text-teal-600 mt-1 block">{totalBenar}</span>
                        </div>
                        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center">
                            <span className="block text-xs font-bold text-rose-700 uppercase tracking-wider">Salah / Dilewati</span>
                            <span className="text-3xl font-black text-rose-600 mt-1 block">{totalSoal - totalBenar}</span>
                        </div>
                    </div>

                    <div className="text-left mb-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Detail Analisis Kalimat</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {riwayat.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 capitalize">{idx + 1}. Target: {item.keyword}</span>
                                        {item.isCorrect ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                                                <CheckCircle2 size={12} /> Sesuai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
                                                <XCircle size={12} /> Salah
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">Jawaban Anda: <span className="italic font-medium text-slate-700">{item.jawabanUser}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleResetQuizz}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20"
                        >
                            <RotateCcw size={18} />
                            Coba Lagi
                        </button>
                        <Link
                            href="/quizz"
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl transition-all"
                        >
                            Back to Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <Link
                    href="/quizz"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
                    Kembali ke Pusat Kuis
                </Link>

                <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 md:p-10 rounded-3xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-6">
                        <Layers size={32} />
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Susun Kata Isyarat SIBI
                    </h1>

                    <p className="text-slate-500 text-lg leading-relaxed mb-8">
                        Perhatikan baik-baik rekaman video isyarat yang tampil, lalu susunlah kembali potongan kata yang diisyaratkan menjadi kalimat utuh yang terstruktur dengan benar.
                    </p>

                    <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 text-left mb-8 flex gap-4 items-start">
                        <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-amber-800 leading-relaxed">
                            <strong className="block mb-1">Aturan Bermain:</strong>
                            Anda memiliki waktu <b>10 Menit</b> untuk memecahkan susunan kalimat dari <b>10 video tantangan</b>. Klik potongan kata untuk menyusun jawaban.
                        </div>
                    </div>

                    <button
                        onClick={() => setHasStarted(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer"
                    >
                        <Play size={18} fill="currentColor" />
                        Mulai Tebak Sekarang
                    </button>
                </div>
            </div>
        );
    }

    if (loading || !soal) return <div className="p-8 text-center text-slate-500">Memuat video tantangan...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <button
                    onClick={handleTimeout}
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
                {/* KOLOM KIRI: Media Video Player */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 items-center justify-center min-h-[350px] lg:h-full">
                    {soal.video_url && soal.video_url.length > 0 ? (
                        soal.video_url.map((urlPath, index) => (
                            <div key={index} className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center shadow-inner">
                                <video
                                    src={`/video${urlPath}`}
                                    autoPlay
                                    controls
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <span className="absolute top-2 left-2 bg-black/60 text-[10px] font-bold text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Video {index + 1}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-slate-500 text-sm text-center py-12">
                            Video tidak tersedia
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: Kontrol Penyusunan Kata */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/75 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm flex flex-col gap-6 flex-1">
                        <div>
                            <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">
                                Tantangan Analisis Kalimat
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Saksikan gerakan isyarat pada video di samping, susun potongan kata berikut:
                            </p>
                        </div>

                        {/* Kotak Area Susunan Kalimat Jawaban Pengguna */}
                        <div className="min-h-20 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
                            {kataTerpilih.length === 0 ? (
                                <p className="text-sm text-slate-400 italic pl-1">Klik kata di bawah untuk mulai menyusun...</p>
                            ) : (
                                kataTerpilih.map((kata, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleBatalKata(kata)}
                                        className="bg-teal-50 border border-teal-200 hover:bg-rose-50 hover:border-rose-200 text-teal-800 hover:text-rose-800 text-sm font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                                    >
                                        {kata}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Blok Opsi Kata yang Tersedia */}
                        <div>
                            <span className="block text-xs font-bold text-slate-400 tracking-wider mb-2.5 px-1 uppercase">Pilihan Kata</span>
                            <div className="flex flex-wrap gap-2">
                                {opsiKata.map((kata, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handlePilihKata(kata)}
                                        className="bg-white border border-slate-200 hover:border-teal-500 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        {kata}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tombol Navigasi Bawah */}
                    <div className="flex gap-4">
                        {/* Tombol Kembali (Aktif dari nomor soal 2 sampai 10) */}
                        {currentIndex > 0 && (
                            <button
                                onClick={handlePrevQuestion}
                                disabled={riwayat[currentIndex - 1]?.isCorrect === true}
                                className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all flex items-center gap-2 cursor-pointer disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                                Kembali
                            </button>
                        )}

                        {/* Kondisi Tombol Berdasarkan Nomor Soal */}
                        {currentIndex < 9 ? (
                            <>
                                <button
                                    onClick={() => handleNextQuestion(false)}
                                    disabled={kataTerpilih.length === 0}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
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
                                onClick={handleSelesaiKuis}
                                className="flex-1 inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer"
                            >
                                Selesai
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}