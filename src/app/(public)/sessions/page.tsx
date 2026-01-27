"use client";

import Link from "next/link";

interface Session {
  id: string;
  title: string;
  speaker: string;
  description: string;
  time: string;
  tags: string[];
  hasVideo: boolean;
}

// ダミーセッションデータ（MicroCMS接続後に置き換え）
const SESSIONS: Session[] = [
  {
    id: "session-1",
    title: "AI時代の翻訳品質管理",
    speaker: "山田 太郎",
    description:
      "AI翻訳ツールの進化に伴い、翻訳品質管理のあり方も大きく変わりつつあります。本セッションでは、最新のQA手法と実践的なワークフローを紹介します。",
    time: "10:00 - 11:00",
    tags: ["AI", "品質管理"],
    hasVideo: true,
  },
  {
    id: "session-2",
    title: "法律翻訳における最新トレンド",
    speaker: "佐藤 花子",
    description:
      "国際契約や法規制の翻訳における最新の動向と、実務で役立つテクニックを解説します。",
    time: "11:15 - 12:15",
    tags: ["法律", "実務"],
    hasVideo: true,
  },
  {
    id: "session-3",
    title: "翻訳テクノロジーの未来",
    speaker: "鈴木 一郎",
    description:
      "機械翻訳、翻訳メモリ、用語管理など、翻訳テクノロジーの最新動向と今後の展望について議論します。",
    time: "13:30 - 14:30",
    tags: ["テクノロジー", "機械翻訳"],
    hasVideo: true,
  },
  {
    id: "session-4",
    title: "フリーランス翻訳者のキャリア戦略",
    speaker: "田中 美咲",
    description:
      "フリーランスとして成功するためのキャリア構築、クライアント獲得、料金設定のポイントを共有します。",
    time: "14:45 - 15:45",
    tags: ["キャリア", "フリーランス"],
    hasVideo: false,
  },
  {
    id: "session-5",
    title: "医薬翻訳の基礎と応用",
    speaker: "高橋 健一",
    description:
      "医薬分野の翻訳に必要な基礎知識から、実際のプロジェクト管理まで幅広く解説します。",
    time: "16:00 - 17:00",
    tags: ["医薬", "専門翻訳"],
    hasVideo: false,
  },
];

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          セッション一覧
        </h1>
        <p className="text-gray-600 mb-8">
          JTF翻訳祭2026のセッションプログラムです。
        </p>

        <div className="space-y-6">
          {SESSIONS.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500 font-mono">
                      {session.time}
                    </span>
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {session.title}
                  </h2>
                  <p className="text-blue-600 font-medium mb-2">
                    {session.speaker}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {session.description}
                  </p>
                </div>

                {session.hasVideo && (
                  <div className="flex-shrink-0">
                    <Link
                      href={`/watch/${session.id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      動画を視聴
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
