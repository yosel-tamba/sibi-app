// app/pengujian/terang/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Info, Camera, CheckCircle2, Cpu, Video, List } from "lucide-react";

// 10 Kata pilihan dari dataset lokal Anda
const LIST_KATA = ["Air", "Anak", "Apa", "Bagaimana", "Bangun", "Besok", "Bicara", "Bisa", "Cepat", "Datang"];

export default function PengujianTerangPage() {
    const [isTesting, setIsTesting] = useState(false);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [riwayatLog, setRiwayatLog] = useState<{ kata: string; status: string }[]>([]);

    // State Hasil Prediksi Model (Real-time dari Flask API /predict)
    const [predictedClass, setPredictedClass] = useState<string>("Menunggu Kamera...");
    const [confidence, setConfidence] = useState<number>(0);

    // Referensi Elemen Media Browser
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [username, setUsername] = useState("yosua");

    useEffect(() => {
        const savedUser = localStorage.getItem("username");
        if (savedUser) setUsername(savedUser);
    }, []);

    // Mengaktifkan kamera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsTesting(true);
                setPredictedClass("Mencari Gerakan...");
            }
        } catch (err) {
            console.error("Gagal membuka akses kamera:", err);
            alert("Mohon izinkan akses kamera untuk melakukan pengujian.");
        }
    };

    // Menghentikan kamera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsTesting(false);
        setPredictedClass("Kamera Mati");
        setConfidence(0);
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

    // Ambil screenshot otomatis untuk dataset lokal saat tombol kata ditekan / manual save
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
                    jarak: "ideal", 
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
        }
    };

    // Loop Inferensi Real-time ke Flask API /predict
    useEffect(() => {
        let predictTimeout: NodeJS.Timeout;
        let isMounted = true;

        const sendFrameForPrediction = async () => {
            if (!isTesting || !videoRef.current) return;

            if (!streamRef.current) {
                predictTimeout = setTimeout(sendFrameForPrediction, 200);
                return;
            }

            const video = videoRef.current;
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

                if (isTesting) {
                    predictTimeout = setTimeout(sendFrameForPrediction, 150);
                }
            }, "image/jpeg");
        };

        if (isTesting) {
            sendFrameForPrediction();
        }

        return () => {
            isMounted = false;
            clearTimeout(predictTimeout);
        };
    }, [isTesting]);

    // Cleanup kamera saat halaman ditutup
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const currentWordLower = LIST_KATA[currentWordIdx].toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header Atas */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <Link href="/pengujian" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors">
                    <ArrowLeft size={16} /> Kembali ke Menu Pengujian
                </Link>
            </div>

            {/* Layout Utama: Kiri (Kamera + Kontrol) & Kanan (Prediksi + Pemutar Video + List Kelas) */}
            <div className="grid lg:grid-cols-2 gap-8 items-stretch">

                {/* KOLOM KIRI: Real-time Camera Feed & Tombol Kontrol On/Off */}
                <div className="flex flex-col gap-4">
                    <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[420px] shadow-md">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                            <Camera size={14} className={`${isTesting ? "animate-pulse text-emerald-400" : "text-rose-500"}`} /> 
                            Webcam Audiens ({username})
                        </div>

                        {!isTesting && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 p-4">
                                <Video size={48} className="mb-2 text-slate-600" />
                                <p className="text-sm font-medium">Kamera dinonaktifkan.</p>
                            </div>
                        )}
                    </div>

                    {/* Tombol ON / OFF Kamera */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-3 shadow-sm">
                        <button
                            onClick={startCamera}
                            disabled={isTesting}
                            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow ${
                                isTesting 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            }`}
                        >
                            Nyalakan Kamera
                        </button>
                        <button
                            onClick={stopCamera}
                            disabled={!isTesting}
                            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow ${
                                !isTesting 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-rose-600 hover:bg-rose-500 text-white"
                            }`}
                        >
                            Matikan Kamera
                        </button>
                    </div>
                </div>

                {/* KOLOM KANAN: Informasi Kata Terpilih, Contoh Video, Hasil Inferensi Model, & List Kelas */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
                    
                    {/* 1. Target Kata yang Harus Diprediksi */}
                    <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-0.5">Target Kelas Isyarat</span>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                {LIST_KATA[currentWordIdx]}
                            </h1>
                        </div>
                        <button 
                            onClick={() => captureAndSaveDataset(LIST_KATA[currentWordIdx])}
                            disabled={!isTesting}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                            Simpan Frame Dataset
                        </button>
                    </div>

                    {/* 2. Video Panduan Contoh Isyarat */}
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                            Video Contoh Gerakan Panduan:
                        </span>
                        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative border border-slate-200 max-h-[180px] flex items-center justify-center">
                            <video
                                key={currentWordLower} 
                                src={`/video/kata/${currentWordLower}1.mp4`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* 3. Panel Monitor Hasil Prediksi Real-Time */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2.5">
                            <Cpu size={14} className={isTesting ? "animate-spin" : ""} /> Hasil Inferensi Model Flask (Live)
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
                                <span className={`text-lg font-mono font-black block ${confidence >= 70 ? "text-emerald-400" : confidence >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                                    {confidence}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. List Kelas Pengujian Kata (Bisa Klik Pindah Manual kapan saja) */}
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                            <List size={14} /> Pilih Target Kelas Kata Pengujian:
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {LIST_KATA.map((kata, idx) => (
                                <button
                                    key={kata}
                                    onClick={() => setCurrentWordIdx(idx)}
                                    className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all truncate ${
                                        currentWordIdx === idx
                                        ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.03]"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                >
                                    {kata}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}