"use client";

import { useState } from "react";

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
  );
}