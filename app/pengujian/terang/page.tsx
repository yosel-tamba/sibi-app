// app/pengujian/terang/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Info, Camera, CheckCircle2, Ruler, Cpu } from "lucide-react";

// 10 Kata hardcode tetap untuk pengujian lintas audience
const LIST_KATA = ["Air", "Anak", "Apa", "Bagaimana", "Bangun", "Besok", "Bicara", "Bisa", "Cepat", "Datang"];

export default function PengujianTerangPage() {
    // State Navigasi & Konfigurasi Jarak
    const [jarakTerpilih, setJarakTerpilih] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // State Jalannya Pengujian Kosakata (3 Detik per kata)
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [riwayatLog, setRiwayatLog] = useState<{ kata: string; status: string }[]>([]);

    // State Hasil Prediksi Model (Real-time dari Flask API /predict)
    const [predictedClass, setPredictedClass] = useState<string>("Mencari Gerakan...");
    const [confidence, setConfidence] = useState<number>(0);

    // Referensi Elemen Media Browser
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Ambil username login atau gunakan default
    const [username, setUsername] = useState("yosua");

    useEffect(() => {
        const savedUser = localStorage.getItem("username");
        if (savedUser) setUsername(savedUser);
    }, []);

    // Mengaktifkan kamera saat pengujian dimulai
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error("Gagal membuka akses kamera:", err);
            alert("Mohon izinkan akses kamera untuk melakukan pengujian.");
            handleBackToMenu();
        }
    };

    // Menghentikan kamera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const handleStartTest = (jarak: string) => {
        setJarakTerpilih(jarak);
        setIsTesting(true);
        setIsFinished(false);
        setCurrentWordIdx(0);
        setCountdown(3);
        setRiwayatLog([]);
        setPredictedClass("Mencari Gerakan...");
        setConfidence(0);
        startCamera(); // 🌟 Langsung panggil tanpa setTimeout
    };

    const handleBackToMenu = () => {
        stopCamera();
        setJarakTerpilih(null);
        setIsTesting(false);
        setIsFinished(false);
    };

    // Fungsi utilitas mengekstrak frame dari video ke Base64 String
    const getFrameBase64 = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg");
        }
        return null;
    };

    // 1. Ambil screenshot otomatis untuk dataset lokal tepat di detik ke-0 sebelum ganti kata
    const captureAndSaveDataset = async (kataSekarang: string) => {
        const dataUrl = getFrameBase64();
        if (!dataUrl) return;

        try {
            const response = await fetch("http://localhost:5000/api/save-screenshot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    kondisi: "terang",
                    jarak: jarakTerpilih,
                    kata: kataSekarang,
                    image: dataUrl,
                }),
            });

            if (response.ok) {
                setRiwayatLog((prev) => [...prev, { kata: kataSekarang, status: "Berhasil Disimpan" }]);
            } else {
                setRiwayatLog((prev) => [...prev, { kata: kataSekarang, status: "Gagal Menyimpan" }]);
            }
        } catch (err) {
            console.error("Error upload dataset:", err);
            setRiwayatLog((prev) => [...prev, { kata: kataSekarang, status: "Koneksi Terputus" }]);
        }
    };

    // 2. Loop Interval Utama Pengujian Jalannya Kata (Setiap 3 detik berganti)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTesting && !isFinished) { // 🌟 Hapus pengecekan streamRef.current dari sini
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        const kataAktif = LIST_KATA[currentWordIdx];

                        // 🌟 Hanya ambil dataset jika stream/kamera sudah siap
                        if (streamRef.current) {
                            captureAndSaveDataset(kataAktif);
                        } else {
                            setRiwayatLog((prevLog) => [...prevLog, { kata: kataAktif, status: "Kamera Belum Siap" }]);
                        }

                        if (currentWordIdx < LIST_KATA.length - 1) {
                            setCurrentWordIdx((prevIdx) => prevIdx + 1);
                            return 3; // Reset timer ke 3 detik untuk kata selanjutnya
                        } else {
                            setIsFinished(true);
                            stopCamera();
                            return 0;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTesting, isFinished, currentWordIdx]);


    // 3. Loop Inferensi Real-time: Mengirim Frame kontinyu menggunakan FormData ke localhost:5000/predict
    // Tambahkan streamRef.current di dependency array (atau buat state baru jika diperlukan)
    useEffect(() => {
        let predictTimeout: NodeJS.Timeout;
        let isMounted = true;

        const sendFrameForPrediction = async () => {
            // Berikan toleransi jika stream belum siap, jangan langsung dimatikan, melainkan antre ulang
            if (!isTesting || isFinished || !videoRef.current) return;

            if (!streamRef.current) {
                predictTimeout = setTimeout(sendFrameForPrediction, 200);
                return;
            }

            const video = videoRef.current;

            // Gunakan fallback ukuran seperti di halaman peragaan agar tidak stuck
            const width = video.videoWidth || 640;
            const height = video.videoHeight || 480;

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                if (!blob || !isMounted) return;

                const formData = new FormData();
                formData.append("file", blob, "frame.jpg");

                try {
                    const response = await fetch("http://localhost:5000/predict", {
                        method: "POST",
                        body: formData,
                    });

                    if (response.ok && isMounted) {
                        const result = await response.json();
                        if (result.class) {
                            setPredictedClass(result.class);
                            const rawConf = result.confidence;
                            setConfidence(rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf));
                        }
                    }
                } catch (err) {
                    console.error("Gagal melakukan inferensi ke Flask API:", err);
                }

                if (isTesting && !isFinished) {
                    predictTimeout = setTimeout(sendFrameForPrediction, 150);
                }
            }, "image/jpeg");
        };

        if (isTesting && !isFinished) {
            sendFrameForPrediction();
        }

        return () => {
            isMounted = false;
            clearTimeout(predictTimeout);
        };
    }, [isTesting, isFinished, streamRef.current]); // <- Tambahkan ini agar terpicu ulang saat kamera menyala

    // Transform nama kata aktif ke format nama file video lowercase
    const currentWordLower = LIST_KATA[currentWordIdx].toLowerCase().replace(/\s+/g, "-");

    // =========================================================
    // TAMPILAN FASE FINISHED (PENGUJIAN SELESAI)
    // =========================================================
    if (isFinished) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={36} />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengujian Selesai!</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        Seluruh dataset frame pengujian audiens Anda berhasil disimpan ke local server Flask.
                    </p>

                    <div className="my-5 p-4 bg-slate-50 rounded-2xl border text-left text-xs font-mono text-slate-600">
                        <p className="font-bold text-slate-800 mb-1">Path Target Lokasi Penyimpanan Gambar:</p>
                        <p className="bg-slate-200/60 p-2 rounded text-teal-700 font-semibold break-all">
                            localhost:5000/{username}/terang/{jarakTerpilih}/[kata].jpg
                        </p>
                    </div>

                    <div className="text-left mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Log Capture Pengujian</h3>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {riwayatLog.map((log, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                                    <span className="font-semibold text-slate-700">{idx + 1}. Isyarat Kata: "{log.kata}"</span>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${log.status === "Berhasil Disimpan" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                        }`}>{log.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleBackToMenu}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
                    >
                        Selesai & Uji Jarak Lain
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // TAMPILAN FASE TESTING (LIVE VIDEO, KATA, CONTOH MP4 & INFERENSI)
    // =========================================================
    if (isTesting) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Top Header info */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <button onClick={handleBackToMenu} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors">
                        <ArrowLeft size={16} /> Batalkan Pengujian
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full uppercase tracking-wider">Kondisi Terang</span>
                        <span className="text-xs font-bold bg-slate-100 border text-slate-600 px-3 py-1.5 rounded-full">Jarak Target: {jarakTerpilih}</span>
                    </div>
                </div>

                {/* Layout Utama Dua Kolom Setara */}
                <div className="grid lg:grid-cols-2 gap-8 items-stretch">

                    {/* KOLOM KIRI: Real-time Camera Feed */}
                    <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[400px]">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                            <Camera size={14} className="animate-pulse text-rose-500" /> Kamera Audiens ({username})
                        </div>
                    </div>

                    {/* KOLOM KANAN: Panduan Kata, Video Contoh, & Hasil Prediksi */}
                    <div className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">

                        {/* 1. Header Progress & Target Kata */}
                        <div className="text-center bg-slate-50 border border-slate-100 p-4 rounded-2xl relative">
                            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-1">
                                Progress: Soal {currentWordIdx + 1} dari 10
                            </span>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase select-none my-1">
                                {LIST_KATA[currentWordIdx]}
                            </h1>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow">
                                {countdown}s
                            </div>
                        </div>

                        {/* 2. Pemutar Video Contoh (/video/kata/[lowercase word]1.mp4) */}
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                                Video Contoh Peragaan Isyarat:
                            </span>
                            <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative border border-slate-200 flex items-center justify-center">
                                <video
                                    key={currentWordLower} // Memaksa re-mount video player saat kata berubah
                                    src={`/video/kata/${currentWordLower}1.mp4`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* 3. Panel Hasil Prediksi Model Real-Time dari Flask */}
                        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
                                <Cpu size={14} className="animate-spin" /> Hasil Inferensi Model Flask (Live)
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Kata Terdeteksi</span>
                                    <span className="text-lg font-bold text-white block tracking-wide truncate">
                                        {predictedClass}
                                    </span>
                                </div>
                                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Confidence Score</span>
                                    <span className={`text-lg font-mono font-black block ${confidence >= 70 ? "text-emerald-400" : confidence >= 40 ? "text-amber-400" : "text-rose-400"
                                        }`}>
                                        {confidence}%
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // MENU UTAMA SELECTION (3 CARD PILIHAN JARAK)
    // =========================================================
    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <Link href="/pengujian" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-8 group">
                <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
                Kembali ke Opsi Kondisi
            </Link>

            <div className="mb-10">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Pengujian Kondisi Terang
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pilih Variasi Jarak Pengujian</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Tentukan parameter jarak antara kamera dengan audiens sebelum memulai pengujian otomatis integrasi model.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Card 50cm */}
                <div onClick={() => handleStartTest("50cm")} className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/30 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                            <Ruler size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">Jarak Dekat (50cm)</h3>
                        <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                            Mengevaluasi performa model dalam membaca struktur detail koordinat segmentasi jari tangan secara penuh dan rapat.
                        </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
                        <span>Mulai Uji 50cm</span>
                        <Play size={12} fill="currentColor" />
                    </div>
                </div>

                {/* Card 100cm */}
                <div onClick={() => handleStartTest("100cm")} className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/30 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                            <Ruler size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">Jarak Ideal (100cm)</h3>
                        <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                            Jarak operasional standar model. Menguji posisi ideal setengah badan *(upper body)* penutur isyarat.
                        </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
                        <span>Mulai Uji 100cm</span>
                        <Play size={12} fill="currentColor" />
                    </div>
                </div>

                {/* Card 150cm */}
                <div onClick={() => handleStartTest("150cm")} className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/30 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                            <Ruler size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">Jarak Jauh (150cm)</h3>
                        <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                            Menguji batas ketahanan ambang deteksi model koordinat tangan terkecil saat audiens berada jauh dari kamera.
                        </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
                        <span>Mulai Uji 150cm</span>
                        <Play size={12} fill="currentColor" />
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex gap-4 items-start">
                <Info className="text-teal-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-slate-600 leading-relaxed">
                    <strong className="block text-slate-800 mb-0.5">Mekanisme Pengujian Model Terintegrasi:</strong>
                    Sistem mengirimkan frame webcam secara simultan ke `localhost:5000/predict` untuk menampilkan *confidence score* model. Setiap kata berganti otomatis setelah **3 detik**, di mana sistem mengambil screenshot otomatis untuk database lokal tepat sebelum pergantian kata.
                </div>
            </div>
        </div>
    );
}