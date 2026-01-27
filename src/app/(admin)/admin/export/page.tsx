"use client";

import Link from "next/link";
import { Navigation, BackgroundOrbs } from "@/components";

export default function AdminExportPage() {
  const handleDownload = (type: string) => {
    window.location.href = `/api/admin/export?type=${type}`;
  };

  const csvTypes = [
    {
      type: "orders",
      title: "注文一覧",
      description: "注文ID, 申込者, チケット種別, 金額, 支払状態, 日時",
      icon: "fa-receipt",
      color: "blue",
    },
    {
      type: "attendees",
      title: "参加者名簿",
      description: "名前, メール, 所属, チケット種別, 申込者/招待者区分",
      icon: "fa-users",
      color: "green",
    },
    {
      type: "onsite",
      title: "会場参加者",
      description: "当日受付用（会場参加権のある参加者のみ）",
      icon: "fa-building",
      color: "purple",
    },
  ];

  return (
    <>
      <BackgroundOrbs />
      <Navigation />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">CSV出力</h1>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
              ← 管理画面に戻る
            </Link>
          </div>

          <div className="space-y-4">
            {csvTypes.map((csv) => (
              <div key={csv.type} className="info-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 bg-${csv.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <i className={`fas ${csv.icon} text-${csv.color}-600`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{csv.title}</h3>
                      <p className="text-sm text-gray-500">{csv.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(csv.type)}
                    className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0077ed] transition-colors flex-shrink-0"
                  >
                    <i className="fas fa-download mr-2"></i>
                    ダウンロード
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
