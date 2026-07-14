"use client";

import Link from "next/link";

export default function PengujianPage() {
  const listPengujian = [
    {
      id: 1,
      kondisi: "terang",
      jarak: "50",
      label: "Ruangan Terang",
      deskripsi: "Pengujian akurasi deteksi isyarat SIBI pada kondisi cahaya cukup.",
      jarakLabel: "Jarak 50 cm",
      bgGradient: "from-amber-50 to-orange-50/30",
      borderColor: "border-amber-100 hover:border-amber-400",
      badgeColor: "bg-amber-100 text-amber-900",
      btnBg: "bg-amber-600 hover:bg-amber-700",
    },
    {
      id: 2,
      kondisi: "terang",
      jarak: "100",
      label: "Ruangan Terang",
      deskripsi: "Pengujian akurasi deteksi isyarat SIBI pada kondisi cahaya cukup.",
      jarakLabel: "Jarak 100 cm",
      bgGradient: "from-amber-50 to-orange-50/30",
      borderColor: "border-amber-100 hover:border-amber-400",
      badgeColor: "bg-amber-100 text-amber-900",
      btnBg: "bg-amber-600 hover:bg-amber-700",
    },
    {
      id: 3,
      kondisi: "terang",
      jarak: "150",
      label: "Ruangan Terang",
      deskripsi: "Pengujian akurasi deteksi isyarat SIBI pada kondisi cahaya cukup.",
      jarakLabel: "Jarak 150 cm",
      bgGradient: "from-amber-50 to-orange-50/30",
      borderColor: "border-amber-100 hover:border-amber-400",
      badgeColor: "bg-amber-100 text-amber-900",
      btnBg: "bg-amber-600 hover:bg-amber-700",
    },
    {
      id: 4,
      kondisi: "redup",
      jarak: "50",
      label: "Ruangan Redup",
      deskripsi: "Pengujian ketahanan model SIBI pada kondisi pencahayaan minim.",
      jarakLabel: "Jarak 50 cm",
      bgGradient: "from-indigo-50 to-purple-50/30",
      borderColor: "border-indigo-100 hover:border-indigo-400",
      badgeColor: "bg-indigo-100 text-indigo-900",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      id: 5,
      kondisi: "redup",
      jarak: "100",
      label: "Ruangan Redup",
      deskripsi: "Pengujian ketahanan model SIBI pada kondisi pencahayaan minim.",
      jarakLabel: "Jarak 100 cm",
      bgGradient: "from-indigo-50 to-purple-50/30",
      borderColor: "border-indigo-100 hover:border-indigo-400",
      badgeColor: "bg-indigo-100 text-indigo-900",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      id: 6,
      kondisi: "redup",
      jarak: "150",
      label: "Ruangan Redup",
      deskripsi: "Pengujian ketahanan model SIBI pada kondisi pencahayaan minim.",
      jarakLabel: "Jarak 150 cm",
      bgGradient: "from-indigo-50 to-purple-50/30",
      borderColor: "border-indigo-100 hover:border-indigo-400",
      badgeColor: "bg-indigo-100 text-indigo-900",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-left">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
          Menu Pengujian Sistem
        </h1>
        <p className="text-slate-600 mt-2">
          Pilih salah satu skenario pengujian di bawah ini berdasarkan intensitas cahaya ruangan dan jarak objek ke kamera.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listPengujian.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between ${item.borderColor}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.badgeColor}`}>
                  {item.label}
                </span>
                <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                  {item.jarakLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Skenario Pengujian {item.id}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {item.deskripsi}
              </p>
            </div>

            <Link
              href={`/pengujian/mulai?kondisi=${item.kondisi}&jarak=${item.jarak}`}
              className={`w-full py-3 rounded-xl text-white text-center font-medium transition duration-200 ${item.btnBg}`}
            >
              Mulai Pengujian
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}