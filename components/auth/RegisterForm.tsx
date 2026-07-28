"use client";

import { useState } from "react";

interface RegisterFormProps {
  onSubmit: (username: string, password: string, confirmPassword: string) => void;
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, password, confirmPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-emerald-900">Username</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Username anda"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-emerald-900">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-emerald-900">Konfirmasi Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi password anda"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition duration-200 font-medium shadow-md shadow-emerald-900/10 tracking-wide cursor-pointer"
      >
        Register
      </button>
    </form>
  );
}