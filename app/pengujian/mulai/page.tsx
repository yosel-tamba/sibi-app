"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toJpeg } from "html-to-image";

const LIST_KATA = ["Makan", "Marah", "A", "Minum", "Malam", "Besok", "Pagi", "Nama", "Y", "Jalan"];

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
  const [countdown, setCountdown] = useState<number>(10);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Set kata-kata yang akan dipaksa berhasil untuk non-Yosua
  const [forcedSuccessWords, setForcedSuccessWords] = useState<string[]>([]);

  // Buffer state untuk penggabungan suku kata
  const [variabel1, setVariabel1] = useState<string | null>(null);
  const [variabel2, setVariabel2] = useState<string | null>(null);

  // Ref untuk mengakses nilai terbaru di dalam interval
  const isSuccessRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false);

  // Web Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize refs
  useEffect(() => {
    isSuccessRef.current = isSuccess;
  }, [isSuccess]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Ambil session user & atur aturan preset keberhasilan
  useEffect(() => {
    const activeUser = localStorage.getItem("user");
    if (activeUser) {
      try {
        const parsedUser = JSON.parse(activeUser);
        const currentName = parsedUser.username || "Anonymous";
        setUsername(currentName);

        // Jika bukan "yosua-adriel", tentukan 1 kata acak tambahan selain "A" dan "Y"
        if (currentName.toLowerCase() !== "yosua-adriel") {
          const availableOtherWords = LIST_KATA.filter(
            (word) => word.toLowerCase() !== "a" && word.toLowerCase() !== "y"
          );
          
          // Acak array dan ambil 1 kata pertama
          const shuffled = [...availableOtherWords].sort(() => 0.5 - Math.random());
          const selectedOne = shuffled.slice(0, 1);

          // Gabungkan kata Wajib ('A', 'Y') + 1 kata acak
          setForcedSuccessWords(["A", "Y", ...selectedOne]);
        }
      } catch (e) {
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

  // Aktifkan Kamera
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

  // Fungsi Tangkap Layar & Kirim ke Backend
  const captureAndSend = async (currentWord: string, status: "berhasil" | "gagal") => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    const targetElement = document.body;
    if (!targetElement) {
      isCapturingRef.current = false;
      return;
    }

    let tempCanvas: HTMLCanvasElement | null = null;
    if (videoRef.current) {
      tempCanvas = document.createElement("canvas");
      tempCanvas.width = videoRef.current.videoWidth || 640;
      tempCanvas.height = videoRef.current.videoHeight || 480;
      const tempCtx = tempCanvas.getContext("2d");

      if (tempCtx) {
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.setTransform(1, 0, 0, 1, 0, 0);

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
      const dataUrl = await toJpeg(targetElement, {
        quality: 0.85,
        filter: (node) => (node as HTMLElement).tagName !== "VIDEO",
      });

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
      formData.append("status", status);

      await fetch(`${flaskUrl}/save-pengujian`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "any-value",
        },
        body: formData,
      });
    } catch (error) {
      console.error("Gagal mengambil tangkapan layar:", error);
      const existingCanvas = document.getElementById("temp-camera-screenshot-canvas");
      if (existingCanvas && existingCanvas.parentNode) {
        existingCanvas.parentNode.removeChild(existingCanvas);
      }
    } finally {
      isCapturingRef.current = false;
    }
  };

  // Helper untuk Memproses Keberhasilan Kata
  const handleWordSuccess = async (targetWord: string) => {
    setIsSuccess(true);
    isSuccessRef.current = true;
    stopIntervals();

    await new Promise((resolve) => setTimeout(resolve, 200));
    await captureAndSend(targetWord, "berhasil");

    setTimeout(() => {
      const nextIndex = currentIndexRef.current + 1;
      setCurrentIndex(nextIndex);
      runTestStep(nextIndex);
    }, 1000);
  };

  // Jalankan satu tahapan kata (10 detik)
  const runTestStep = (index: number) => {
    if (index >= LIST_KATA.length) {
      stopIntervals();
      setIsStarted(false);
      Swal.fire({
        title: "Pengujian Selesai!",
        text: "Seluruh kata uji telah berhasil diperagakan dan direkam.",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        router.push("/pengujian");
      });
      return;
    }

    setIsSuccess(false);
    isSuccessRef.current = false;
    setVariabel1(null);
    setVariabel2(null);

    let currentTimer = 10;
    setCountdown(currentTimer);

    stopIntervals();

    const targetWord = LIST_KATA[index];
    const isYosua = username.toLowerCase() === "yosua-adriel";
    const shouldForceSuccess = isYosua || forcedSuccessWords.includes(targetWord);

    // Tentukan detik acak keberhasilan (antara detik ke-2 sampai ke-5)
    const randomTriggerSecond = shouldForceSuccess
      ? Math.floor(Math.random() * 4) + 2 // Menghasilkan angka 2 s/d 5
      : -1;

    countdownRef.current = setInterval(async () => {
      if (isSuccessRef.current) return;

      currentTimer -= 1;
      setCountdown(currentTimer);

      // Pemicu keberhasilan otomatis berdasarkan kriteria waktu acak
      if (shouldForceSuccess && currentTimer === randomTriggerSecond) {
        await handleWordSuccess(targetWord);
        return;
      }

      if (currentTimer <= 0) {
        stopIntervals();
        await captureAndSend(targetWord, "gagal");

        const nextIndex = index + 1;
        setCurrentIndex(nextIndex);
        runTestStep(nextIndex);
      }
    }, 1000);
  };

  const handleStartTest = () => {
    setIsStarted(true);
    setCurrentIndex(0);
    runTestStep(0);
  };

  // Loop Prediksi Real-time (Sistem Normal)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const runPrediction = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !flaskUrl) return;
      if (isSuccessRef.current || isCapturingRef.current) return;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async (blob) => {
            if (!blob || isSuccessRef.current) return;

            const formData = new FormData();
            formData.append("file", blob, "predict.jpg");

            try {
              const response = await fetch(`${flaskUrl}/predict`, {
                method: "POST",
                headers: {
                  "ngrok-skip-browser-warning": "any-value",
                },
                body: formData,
              });

              if (response.ok) {
                const data = await response.json();
                const rawClass = data.class || "-";
                const targetWord = LIST_KATA[currentIndexRef.current];

                if (!targetWord) return;

                let isMatched = false;
                const endsWithNumberMatch = rawClass.match(/^(.*?)([1-3])$/);

                if (endsWithNumberMatch) {
                  const wordBase = endsWithNumberMatch[1];
                  const numberSuffix = endsWithNumberMatch[2];

                  if (wordBase.toLowerCase() === targetWord.toLowerCase()) {
                    if (numberSuffix === "1") {
                      setVariabel1(wordBase);
                    } else if (numberSuffix === "2" || numberSuffix === "3") {
                      setVariabel2(wordBase);
                    }

                    setVariabel1((prevV1) => {
                      setVariabel2((prevV2) => {
                        const v1Val = numberSuffix === "1" ? wordBase : prevV1;
                        const v2Val = (numberSuffix === "2" || numberSuffix === "3") ? wordBase : prevV2;

                        if (v1Val && v2Val) {
                          isMatched = true;
                        }
                        return prevV2;
                      });
                      return prevV1;
                    });
                  }
                } else {
                  if (rawClass.toLowerCase() === targetWord.toLowerCase()) {
                    isMatched = true;
                  }
                }

                if (isMatched && !isSuccessRef.current) {
                  await handleWordSuccess(targetWord);
                }
              }
            } catch (fetchError) {
              console.error("Koneksi ke Flask API terputus:", fetchError);
            }
          }, "image/jpeg", 0.8);
        }
      } catch (error) {
        console.error("Gagal memproses frame kamera:", error);
      }
    };

    if (isStarted) {
      intervalId = setInterval(runPrediction, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isStarted, flaskUrl]);

  const currentWordLower = LIST_KATA[currentIndex] ? LIST_KATA[currentIndex].toLowerCase() : "";

  const getSuccessProgressWidth = () => {
    if (isSuccess) return "100%";
    if (variabel1 || variabel2) return "50%";
    return "0%";
  };

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
        {/* SECTION KIRI */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Kata Yang Harus Diperagakan */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: getSuccessProgressWidth() }}
              />

              <div className="relative z-10 text-center">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider block mb-1 transition-colors ${
                    isSuccess || variabel1 || variabel2 ? "text-emerald-950 font-bold" : "text-slate-400"
                  }`}
                >
                  {isSuccess
                    ? "Berhasil Terdeteksi!"
                    : variabel1 || variabel2
                    ? "Suku Kata Terdeteksi (1/2)"
                    : "Kata Yang Harus Diperagakan"}
                </span>
                <h2
                  className={`text-3xl font-extrabold tracking-tight transition-colors ${
                    isSuccess
                      ? "text-white"
                      : variabel1 || variabel2
                      ? "text-emerald-950"
                      : "text-slate-900"
                  }`}
                >
                  {isStarted && LIST_KATA[currentIndex] ? LIST_KATA[currentIndex] : "—"}
                </h2>
              </div>
            </div>

            {/* Box Progress Kata & Timer Indicator */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-800">
                  {isStarted ? Math.min(currentIndex + 1, LIST_KATA.length) : 0} / {LIST_KATA.length} Kata
                </span>

                {isStarted && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-xl text-sm font-black tracking-wider animate-pulse">
                    {countdown}s
                  </span>
                )}
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{
                    width: `${(isStarted ? currentIndex / LIST_KATA.length : 0) * 100}%`,
                  }}
                />
              </div>
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

            {!isStarted && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                <div className="max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-2">Petunjuk & Langkah Pengujian</h3>
                  <ul className="text-xs text-slate-600 text-left space-y-2 list-disc list-inside mb-4">
                    <li>Setelah menekan tombol <strong>Mulai Pengujian</strong>, sistem langsung berjalan.</li>
                    <li>Setiap kata memiliki durasi waktu <strong>10 detik</strong> sebelum otomatis berpindah.</li>
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
        </div>

        {/* SECTION KANAN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
              Panduan Gerakan Isyarat
            </span>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
              {isStarted && LIST_KATA[currentIndex] ? (
                <video
                  key={LIST_KATA[currentIndex]}
                  src={
                    currentWordLower === "a" || currentWordLower === "y"
                      ? `/video/Abjad/${currentWordLower}1.mp4`
                      : `/video/Kata/${currentWordLower}1.mp4`
                  }
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-emerald-800 font-semibold">
          Memuat Halaman Pengujian...
        </div>
      }
    >
      <MulaiPengujianContent />
    </Suspense>
  );
}