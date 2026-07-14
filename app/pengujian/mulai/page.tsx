"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import { toJpeg } from 'html-to-image';

const LIST_KATA = ["Air", "Anak", "Apa", "Bagaimana", "Bangun", "Besok", "Bicara", "Bisa", "Cepat", "Datang"];

// 1. Buat komponen utama yang berisi seluruh logika halaman Anda
function MulaiPengujianContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const kondisi = searchParams.get("kondisi") || "terang";
    const jarak = searchParams.get("jarak") || "50";
    const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // State Session & Pengujian
    const [username, setUsername] = useState<string>("");
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [countdown, setCountdown] = useState<number>(5);

    // State Hasil Prediksi Backend
    const [predictedWord, setPredictedWord] = useState<string>("-");
    const [confidence, setConfidence] = useState<number>(0);

    // Web Ref
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Ambil session user saat halaman di-load
    useEffect(() => {
        const activeUser = localStorage.getItem("user");
        if (activeUser) {
            try {
                const parsedUser = JSON.parse(activeUser);
                if (parsedUser.username) {
                    setUsername(parsedUser.username);
                } else {
                    setUsername("Anonymous");
                }
            } catch (e) {
                console.error("Gagal membaca session user:", e);
                setUsername("Anonymous");
            }
        } else {
            Swal.fire({
                title: "Akses Ditolak",
                text: "Silakan login terlebih dahulu sebelum melakukan pengujian.",
                icon: "warning",
                confirmButtonColor: "#10b981",
            }).then(() => {
                router.push("/login");
            });
        }
    }, [router]);

    // Mengaktifkan Kamera otomatis
    useEffect(() => {
        async function enableCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Gagal mengakses kamera:", err);
                Swal.fire({
                    title: "Kamera Tidak Ditemukan",
                    text: "Pastikan Anda memberikan izin akses kamera perangkat ini.",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                });
            }
        }

        enableCamera();

        return () => {
            stopIntervals();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const stopIntervals = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const captureAndSend = async (currentWord: string) => {
        const targetElement = document.body;
        if (!targetElement) return;

        // 1. BUAT KANVAS SEMENTARA UNTUK MENANGKAP GAMBAR DARI VIDEO KAMERA AKTIF
        let tempCanvas: HTMLCanvasElement | null = null;
        if (videoRef.current) {
            tempCanvas = document.createElement("canvas");
            tempCanvas.width = videoRef.current.videoWidth || 640;
            tempCanvas.height = videoRef.current.videoHeight || 480;
            const tempCtx = tempCanvas.getContext("2d");

            if (tempCtx) {
                // Gambar frame video saat ini ke kanvas kustom
                // scale-x-[-1] diaplikasikan di sini agar hasil screenshot kameranya mirror/sesuai tampilan di layar
                tempCtx.translate(tempCanvas.width, 0);
                tempCtx.scale(-1, 1);
                tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

                // Masukkan kanvas sementara ini ke dalam DOM tepat di samping video agar bisa ikut terscan
                tempCanvas.style.position = "absolute";
                tempCanvas.style.top = "0";
                tempCanvas.style.left = "0";
                tempCanvas.style.width = "100%";
                tempCanvas.style.height = "100%";
                tempCanvas.style.objectFit = "cover";
                tempCanvas.style.borderRadius = "inherit";
                tempCanvas.id = "temp-camera-screenshot-canvas";

                videoRef.current.parentElement?.appendChild(tempCanvas);
            }
        }

        try {
            // 2. JALANKAN SCREENSHOT HALAMAN
            const dataUrl = await toJpeg(targetElement, {
                quality: 0.85,
                // Sekarang kita hanya menyembunyikan tag <video>, 
                // tetapi tampilan kamera tetap ada karena digantikan oleh tempCanvas di atas!
                filter: (node) => {
                    return (node as HTMLElement).tagName !== 'VIDEO';
                }
            });

            // Hapus kanvas sementara setelah screenshot selesai diambil agar tidak mengganggu live stream kamera
            if (tempCanvas && tempCanvas.parentNode) {
                tempCanvas.parentNode.removeChild(tempCanvas);
            }

            const responseBlob = await fetch(dataUrl);
            const blob = await responseBlob.blob();

            const formData = new FormData();
            formData.append("file", blob, "capture.jpg");
            formData.append("username", username);
            formData.append("kata_target", currentWord);
            formData.append("kondisi", kondisi);
            formData.append("jarak", jarak);

            const response = await fetch(`${flaskUrl}/predict-pengujian`, {
                method: "POST",
                headers: {
                    "ngrok-skip-browser-warning": "any-value",
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPredictedWord(data.class || "-");
                setConfidence(data.confidence || 0);
            }
        } catch (error) {
            console.error("Gagal mengambil tangkapan layar penuh:", error);
            // Pastikan kanvas sementara tetap dihapus jika terjadi error
            const existingCanvas = document.getElementById("temp-camera-screenshot-canvas");
            if (existingCanvas && existingCanvas.parentNode) {
                existingCanvas.parentNode.removeChild(existingCanvas);
            }
        }
    };

    const handleStartTest = () => {
        setIsStarted(true);
        setCurrentIndex(0);
        setCountdown(5);
        setPredictedWord("-");
        setConfidence(0);

        runTestStep(0);
    };

    const runTestStep = (index: number) => {
        if (index >= LIST_KATA.length) {
            stopIntervals();
            Swal.fire({
                title: "Pengujian Selesai!",
                text: "Seluruh kata uji telah berhasil diperagakan dan direkam.",
                icon: "success",
                confirmButtonColor: "#10b981",
            }).then(() => {
                router.push("/pengujian");
            });
            setIsStarted(false);
            return;
        }

        let currentTimer = 5;
        setCountdown(currentTimer);

        countdownRef.current = setInterval(() => {
            currentTimer -= 1;
            setCountdown(currentTimer);

            // Ambil screenshot tangkapan layar di detik terakhir (saat timer bernilai 1 menuju habis)
            if (currentTimer === 1) {
                captureAndSend(LIST_KATA[index]);
            }

            if (currentTimer <= 0) {
                clearInterval(countdownRef.current!);
                const nextIndex = index + 1;
                setCurrentIndex(nextIndex);
                runTestStep(nextIndex);
            }
        }, 1000);
    };

    const currentWordLower = LIST_KATA[currentIndex] ? LIST_KATA[currentIndex].toLowerCase() : "";

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 pb-2">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
                        Proses Pengujian Sistem
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kondisi: <span className="capitalize font-semibold text-emerald-700">{kondisi}</span> | Jarak: <span className="font-semibold text-emerald-700">{jarak} cm</span>
                    </p>
                </div>
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 px-4 py-2 rounded-2xl text-sm font-medium">
                    Penguji: <span className="font-bold">{username}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ================== SECTION KIRI: KAMERA & HASIL PREDIKSI ================== */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Progress & Timer Indicator */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            {/* Posisi Kiri: Menampilkan Angka Progress Soal */}
                            <span className="text-sm font-bold text-emerald-800">
                                {isStarted ? Math.min(currentIndex + 1, LIST_KATA.length) : 0} / {LIST_KATA.length} Kata
                            </span>

                            {/* Posisi Kanan: Hanya Menampilkan Angka Timer Saja */}
                            {isStarted && (
                                <span className="bg-red-600 text-white px-3 py-1 rounded-xl text-sm font-black tracking-wider animate-pulse">
                                    {countdown}s
                                </span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-emerald-600 h-full transition-all duration-300"
                                style={{
                                    width: `${(isStarted ? currentIndex / LIST_KATA.length : 0) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Container Video Kamera */}
                    <div className="bg-slate-900 rounded-3xl overflow-hidden aspect-video relative shadow-inner border border-slate-800">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                        />

                        {/* Overlay Status Kamera */}
                        {!isStarted && (
                            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                                <div className="max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                    <h3 className="text-base font-bold text-slate-900 mb-2">Petunjuk & Langkah Pengujian</h3>
                                    <ul className="text-xs text-slate-600 text-left space-y-2 list-disc list-inside mb-4">
                                        <li>Setelah menekan tombol <strong>Mulai Pengujian</strong>, sistem langsung berjalan.</li>
                                        <li>Setiap kata memiliki durasi waktu <strong>5 detik</strong> sebelum otomatis berpindah.</li>
                                        <li>Pastikan Anda fokus memperagakan gerakan isyarat sesuai instruksi.</li>
                                    </ul>
                                    <button
                                        onClick={handleStartTest}
                                        className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-white py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-800 transition shadow-md shadow-emerald-950/20 cursor-pointer"
                                    >
                                        Mulai Pengujian Sekarang
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hasil Predict & Confidence */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl shadow-md text-white grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div className="sm:border-r border-slate-800 sm:pr-6 space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                                Hasil Prediksi Model
                            </span>
                            <p className="text-3xl font-bold text-emerald-400 truncate">
                                {predictedWord}
                            </p>
                        </div>
                        <div className="sm:pl-6 space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                                Confidence Score
                            </span>
                            <div className="flex items-center gap-4">
                                <p className="text-3xl font-bold text-amber-400">
                                    {(confidence * 100).toFixed(1)}%
                                </p>
                                <div className="flex-grow bg-slate-800 h-3 rounded-full overflow-hidden hidden sm:block">
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-300"
                                        style={{ width: `${confidence * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================== SECTION KANAN: KONTROL & PROGRESS ================== */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Kata yang Harus Diperagakan */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            Kata Yang Harus Diperagakan
                        </span>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight min-h-[3rem] flex items-center justify-center">
                            {isStarted && LIST_KATA[currentIndex] ? LIST_KATA[currentIndex] : "—"}
                        </h2>
                    </div>

                    {/* Contoh Video/Gambar Instruksi */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                            Panduan Gerakan Isyarat
                        </span>
                        <div className="aspect-video bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                            {isStarted && LIST_KATA[currentIndex] ? (
                                <video
                                    key={LIST_KATA[currentIndex]}
                                    src={`/video/kata/${currentWordLower}1.mp4`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLVideoElement;
                                        target.style.display = "none";
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MulaiPengujianPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen text-emerald-800 font-semibold">
                Memuat Halaman Pengujian...
            </div>
        }>
            <MulaiPengujianContent />
        </Suspense>
    );
}