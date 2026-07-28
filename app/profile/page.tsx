"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
    User,
    History,
    Lock,
    Mail,
    Save,
    Loader2,
    Calendar,
    ArrowLeft,
    ChevronRight,
    Eye,
    Clock,
    FileText,
    Video
} from "lucide-react";

interface UserSession {
    id: number;
    username: string;
    email: string;
}

interface AttemptItem {
    id: number;
    attempt: number;
    jawaban_user: string;
    created_at: string;
    peragaan_id?: number;
    susunkata_id?: number;
    pg_id?: number;
    // Field Evaluasi
    instruksi?: string;
    video_url?: string | string[];
    jawaban_benar?: string;
    pertanyaan?: string;
}

interface AttemptGroup {
    attempt: number;
    data: AttemptItem[];
}

// Sub-komponen helper untuk menangani parser & display video (String tunggal maupun Array JSON)
function RenderVideoList({ videoUrl, label }: { videoUrl?: string | string[]; label: string }) {
    if (!videoUrl) return null;

    let videoList: string[] = [];
    try {
        if (Array.isArray(videoUrl)) {
            videoList = videoUrl;
        } else if (typeof videoUrl === "string") {
            const parsed = JSON.parse(videoUrl);
            videoList = Array.isArray(parsed) ? parsed : [parsed];
        }
    } catch {
        videoList = [videoUrl as string];
    }

    // Filter jika ada elemen kosong
    videoList = videoList.filter((url) => typeof url === "string" && url.trim() !== "");
    if (videoList.length === 0) return null;

    return (
        <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Video size={14} className="text-emerald-600" />
                {label} {videoList.length > 1 && `(${videoList.length} Video)`}:
            </p>

            <div className={`grid gap-3 ${videoList.length > 1 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl" : "grid-cols-1 max-w-md"}`}>
                {videoList.map((url, vIdx) => {
                    const cleanPath = url.replace(/^\//, '');
                    const finalSrc = `/video/${cleanPath}`;

                    return (
                        <div key={vIdx} className="rounded-xl overflow-hidden border border-slate-200 bg-black flex flex-col justify-between">
                            <video
                                src={finalSrc}
                                controls
                                className="max-h-72 w-auto max-w-full block"
                            />
                            {videoList.length > 1 && (
                                <div className="bg-slate-900 text-slate-300 text-[11px] px-3 py-1.5 border-t border-slate-800 text-center font-medium">
                                    Video #{vIdx + 1}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();

    // State Management
    const [activeTab, setActiveTab] = useState<"profile" | "peragaan" | "susunkata" | "pg">("profile");
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // User Profile State
    const [user, setUser] = useState<UserSession | null>(null);
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // History State
    const [historyData, setHistoryData] = useState<AttemptGroup[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [selectedAttempt, setSelectedAttempt] = useState<AttemptGroup | null>(null);

    // Handler Ganti Tab
    const handleTabChange = (tab: "profile" | "peragaan" | "susunkata" | "pg") => {
        setActiveTab(tab);
        setSelectedAttempt(null);
    };

    // 1. Ambil data user dari localStorage & Backend
    useEffect(() => {
        const localUserStr = localStorage.getItem("user");
        if (!localUserStr) {
            Swal.fire({
                title: "Akses Ditolak",
                text: "Silakan login terlebih dahulu.",
                icon: "warning",
                confirmButtonColor: "#059669"
            });
            router.push("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(localUserStr);
            setUser(parsedUser);
            fetchUserData(parsedUser.id);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [router]);

    // Fetch Data User Detail
    const fetchUserData = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:5000/user/${id}`);
            const result = await res.json();

            if (res.ok && result.status === "success") {
                setUsername(result.data.username || "");
                setEmail(result.data.email || "");
            }
        } catch (error) {
            console.error("Gagal mengambil profil user:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Riwayat Kuis berdasarkan Tab yang Aktif
    useEffect(() => {
        if (!user?.id || activeTab === "profile") return;

        const fetchHistory = async () => {
            setHistoryLoading(true);
            setSelectedAttempt(null);
            let endpoint = "";

            if (activeTab === "peragaan") endpoint = `/user/${user.id}/history/peragaan`;
            if (activeTab === "susunkata") endpoint = `/user/${user.id}/history/susun-kata`;
            if (activeTab === "pg") endpoint = `/user/${user.id}/history/pilihan-ganda`;

            try {
                const res = await fetch(`http://localhost:5000${endpoint}`);
                const result = await res.json();

                if (res.ok && result.status === "success") {
                    setHistoryData(result.history || []);
                } else {
                    setHistoryData([]);
                }
            } catch (error) {
                console.error("Gagal mengambil riwayat:", error);
                setHistoryData([]);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [activeTab, user]);

    // Handle Update User
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:5000/user/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password: password || ""
                })
            });

            const result = await res.json();

            if (res.ok) {
                const updatedSession = { ...user, username, email };
                localStorage.setItem("user", JSON.stringify(updatedSession));

                setPassword("");
                Swal.fire({
                    title: "Berhasil!",
                    text: "Password berhasil diubah.",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.error || "Gagal memperbarui profil");
            }
        } catch (err: any) {
            Swal.fire({
                title: "Gagal!",
                text: err.message,
                icon: "error",
                confirmButtonColor: "#059669"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-emerald-800">
                <Loader2 size={36} className="animate-spin text-emerald-600" />
                <p className="font-medium text-sm">Memuat profil...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* MAIN CONTENT CARD */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden">

                {/* TAB HEADER LINKS */}
                <div className="flex border-b border-slate-200/80 overflow-x-auto no-scrollbar bg-slate-50/50">
                    <button
                        onClick={() => handleTabChange("profile")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "profile"
                                ? "border-emerald-600 text-emerald-800 bg-white"
                                : "border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-100/50"
                            }`}
                    >
                        <span>Profile</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("peragaan")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "peragaan"
                                ? "border-emerald-600 text-emerald-800 bg-white"
                                : "border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-100/50"
                            }`}
                    >
                        <span>Riwayat Peragaan</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("susunkata")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "susunkata"
                                ? "border-emerald-600 text-emerald-800 bg-white"
                                : "border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-100/50"
                            }`}
                    >
                        <span>Riwayat Susun Kata</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("pg")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "pg"
                                ? "border-emerald-600 text-emerald-800 bg-white"
                                : "border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-100/50"
                            }`}
                    >
                        <span>Riwayat Pilihan Ganda</span>
                    </button>
                </div>

                {/* TAB BODY CONTENT */}
                <div className="p-6 md:p-8">

                    {/* 1. KONTEN TAB PROFILE */}
                    {activeTab === "profile" && (
                        <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
                            {/* Username (Disabled) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <User size={16} className="text-emerald-600" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={username}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm transition"
                                    placeholder="Masukkan username"
                                />
                                <p className="text-[11px] text-slate-400">Username bersifat unik dan tidak dapat diubah.</p>
                            </div>

                            {/* Email (Disabled) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Mail size={16} className="text-emerald-600" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={email}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm transition"
                                    placeholder="nama@email.com"
                                />
                                <p className="text-[11px] text-slate-400">Email terdaftar tidak dapat diubah.</p>
                            </div>

                            {/* Password Baru */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Lock size={16} className="text-emerald-600" />
                                    Ubah Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition"
                                    placeholder="Masukkan password baru"
                                />
                                <p className="text-[11px] text-slate-400">Isi kolom ini hanya jika Anda ingin mengganti password akun.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-200 cursor-pointer disabled:opacity-50 mt-4"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* 2. KONTEN TAB RIWAYAT (PERAGAAN / SUSUN KATA / PG) */}
                    {activeTab !== "profile" && (
                        <div>
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                                    <Loader2 size={28} className="animate-spin text-emerald-600" />
                                    <p className="text-sm">Mengambil riwayat kuis...</p>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 space-y-2">
                                    <History size={40} className="mx-auto text-slate-300" />
                                    <p className="text-base font-medium">Belum ada riwayat pengerjaan.</p>
                                </div>
                            ) : selectedAttempt ? (
                                /* TAMPILAN DETAIL PERCOBAAN / ATTEMPT */
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    {/* BAR TOMBOL KEMBALI */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAttempt(null)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition cursor-pointer"
                                        >
                                            <ArrowLeft size={18} />
                                            <span>Kembali ke Card</span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs">
                                                Percobaan ke-{selectedAttempt.attempt}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                                                ({selectedAttempt.data.length} Soal)
                                            </span>
                                        </div>
                                    </div>

                                    {/* LIST EVALUASI SOAL & JAWABAN */}
                                    <div className="space-y-4">
                                        {selectedAttempt.data.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-4 hover:border-emerald-200 transition"
                                            >
                                                {/* Header Item Soal */}
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                                                        Soal #{idx + 1}
                                                    </span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                        <Calendar size={13} />
                                                        {item.created_at}
                                                    </span>
                                                </div>

                                                {/* KONTEN TAB 1: PERAGAAN */}
                                                {activeTab === "peragaan" && (
                                                    <div className="space-y-3">
                                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                Instruksi Soal:
                                                            </p>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {item.instruksi || "Instruksi tidak tersedia"}
                                                            </p>
                                                        </div>

                                                        <div className="pt-1">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                Jawaban Anda:
                                                            </p>
                                                            <span className="inline-block px-3.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold text-sm rounded-xl">
                                                                {item.jawaban_user}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KONTEN TAB 2: SUSUN KATA */}
                                                {activeTab === "susunkata" && (
                                                    <div className="space-y-4">
                                                        {/* Render Video List (Bisa Array JSON atau String tunggal) */}
                                                        <RenderVideoList
                                                            videoUrl={item.video_url}
                                                            label="Video Peragaan Soal"
                                                        />

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                                                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                                                    Jawaban Anda
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {item.jawaban_user}
                                                                </p>
                                                            </div>

                                                            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                                                                    Jawaban Benar
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {item.jawaban_benar || "-"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KONTEN TAB 3: PILIHAN GANDA */}
                                                {activeTab === "pg" && (
                                                    <div className="space-y-4">
                                                        {item.pertanyaan && (
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                    Pertanyaan:
                                                                </p>
                                                                <p className="text-sm font-semibold text-slate-800">
                                                                    {item.pertanyaan}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Render Video Pendukung Soal */}
                                                        <RenderVideoList
                                                            videoUrl={item.video_url}
                                                            label="Video Pendukung Soal"
                                                        />

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                                                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                                                    Jawaban Anda
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {item.jawaban_user}
                                                                </p>
                                                            </div>

                                                            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                                                                    Jawaban Benar
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {item.jawaban_benar || "-"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* TAMPILAN CARD GRID ATTEMPT */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                                    {historyData.map((group) => (
                                        <div
                                            key={group.attempt}
                                            onClick={() => setSelectedAttempt(group)}
                                            className="group border border-slate-200/80 hover:border-emerald-500/50 bg-white hover:bg-emerald-50/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200/60">
                                                        Percobaan ke-{group.attempt}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-600 transition flex items-center gap-1">
                                                        Lihat <ChevronRight size={14} />
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-lg font-bold text-slate-800 group-hover:text-emerald-950 transition">
                                                        {group.data.length} Soal Dijawab
                                                    </p>
                                                    {group.data[0]?.created_at && (
                                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            <span>{group.data[0].created_at}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                                                <span className="flex items-center gap-1">
                                                    <FileText size={14} /> Buka Riwayat Evaluasi
                                                </span>
                                                <Eye size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}