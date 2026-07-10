"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hand } from "lucide-react";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // 1. Load script Google Identity Services otomatis saat halaman dibuka
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: "563359945454-im6135gmgqa93pi0225t1amtr7bnstf4.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });

      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    };
  }, []);

  // 2. Handler jika user login menggunakan Google
  const handleGoogleLogin = async (response: any) => {
    try {
      // Diubah ke rute register-google / login-google sesuai backend Flask-mu
      const res = await fetch("http://localhost:5000/register-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        // MEMBUAT SESSION GOOGLE: Mengambil data nama/username dari response token Google yang dikirim Flask
        // Jika backend-mu belum melempar key 'user', kita fallback ke penamaan default yang aman
        const googleUserSession = data.user || {
          username: data.username || "Google User",
          email: data.email || ""
        };

        await Swal.fire({
          title: "Login Berhasil!",
          text: `Selamat datang kembali, ${googleUserSession.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Simpan data session user Google ke localStorage
        localStorage.setItem("user", JSON.stringify(googleUserSession));
        router.push("/");
      } else {
        Swal.fire({
          title: "Login Gagal",
          text: data.message || "Gagal masuk menggunakan Google.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Koneksi Bermasalah",
        text: "Tidak dapat terhubung ke server backend.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // 3. Handler login manual (Mencocokkan Username + Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: "Login Sukses!",
          text: `Selamat datang kembali, ${data.user.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // MEMBUAT SESSION MANUAL: Menyimpan data user asli dari database Flask
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        Swal.fire({
          title: "Gagal Masuk",
          text: data.message || "Username atau password salah.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Koneksi Bermasalah",
        text: "Tidak dapat terhubung ke server backend.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

        <div className="">
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-900">
          Welcome Back
        </h1>

        <p className="text-center text-slate-600 mt-2">
          Login untuk melanjutkan pembelajaran
        </p>

        {/* TOMBOL LOGIN LEWAT GOOGLE */}
        <div className="mt-6">
          <div id="googleBtn"></div>
        </div>

        {/* PEMBATAL / GARIS PEMISAH */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-sm">atau login manual</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* FORM LOGIN MANUAL */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username anda"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}