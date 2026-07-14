"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  const handleGoogleLogin = async (response: any) => {
    try {
      const res = await fetch(`${flaskUrl}/register-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value"
        },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        const googleUserSession = {
          id: data.user?.id || data.id || null,
          username: data.user?.username || data.username || "Google User",
          email: data.user?.email || data.email || ""
        };

        await Swal.fire({
          title: "Login Berhasil!",
          text: `Selamat datang kembali, ${googleUserSession.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        localStorage.setItem("user", JSON.stringify(googleUserSession));
        router.push("/");
      } else {
        Swal.fire({
          title: "Login Gagal",
          text: data.message || "Gagal masuk menggunakan Google.",
          icon: "error",
          confirmButtonColor: "#10b981",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Koneksi Bermasalah",
        text: "Tidak dapat terhubung ke server backend.",
        icon: "error",
        confirmButtonColor: "#10b981",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${flaskUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value"
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

        const userSessionData = {
          id: data.user?.id || data.id,
          username: data.user?.username || data.username,
          email: data.user?.email || data.email
        };

        localStorage.setItem("user", JSON.stringify(userSessionData));
        router.push("/");
      } else {
        Swal.fire({
          title: "Gagal Masuk",
          text: data.message || "Username atau password salah.",
          icon: "error",
          confirmButtonColor: "#10b981",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Koneksi Bermasalah",
        text: "Tidak dapat terhubung ke server backend.",
        icon: "error",
        confirmButtonColor: "#10b981",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/40 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 w-96 h-96 bg-green-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 relative z-10">

        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
          Welcome Back
        </h1>

        <p className="text-center text-slate-600 mt-2 text-sm">
          Login untuk melanjutkan pembelajaran
        </p>

        <div className="mt-6">
          {/* Div pembungkus utama */}
          <div className="w-full">
            <div
              id="googleBtn"
              className="g_id_signin"
              data-type="standard"
              data-shape="rectangular"
              data-theme="outline"
              data-size="large"
              data-logo_alignment="left"
              data-width="100%" /* Atribut data-width di HTML lebih stabil membaca 100% */
            ></div>
          </div>
        </div>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs tracking-wide">atau login manual</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-emerald-900">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username anda"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-emerald-900">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition duration-200 font-medium shadow-md shadow-emerald-900/10 tracking-wide cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}