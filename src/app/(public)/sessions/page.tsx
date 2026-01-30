"use client";

import { useState } from "react";
import { Navigation, BackgroundOrbs } from "@/components";

interface Speaker {
  id: number;
  name: string;
  nameEn: string;
  title: string;
  photo: string;
  sessionTitle: string;
  category: string;
  categoryLabel: string;
  description: string;
}

// サンプル登壇者データ（MicroCMS接続後に置き換え）
const SPEAKERS: Speaker[] = [
  {
    id: 1,
    name: "山田 太郎",
    nameEn: "Taro Yamada",
    title: "株式会社トランスリンク 代表取締役",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "AIと共存する翻訳者のキャリア戦略",
    category: "keynote",
    categoryLabel: "基調講演",
    description: "20年以上の翻訳業界経験を持ち、テクノロジーと人間の協働について研究。生成AI時代における翻訳者の新しい役割と価値創造について語ります。",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    nameEn: "Sarah Johnson",
    title: "Global Localization Director, TechCorp",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "グローバル企業のローカライゼーション戦略",
    category: "keynote",
    categoryLabel: "基調講演",
    description: "Fortune 500企業でのローカライゼーション戦略を15年間リード。多言語展開とブランド一貫性の両立について、実践的な知見を共有します。",
  },
  {
    id: 3,
    name: "鈴木 美咲",
    nameEn: "Misaki Suzuki",
    title: "フリーランス医薬翻訳者",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "医薬翻訳における品質管理の最前線",
    category: "workshop",
    categoryLabel: "ワークショップ",
    description: "医薬品の承認申請書類翻訳のスペシャリスト。規制要件を満たしながら効率的に高品質な翻訳を提供するためのワークフローを解説します。",
  },
  {
    id: 4,
    name: "Michael Chen",
    nameEn: "Michael Chen",
    title: "AI Research Lead, LanguageAI Inc.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "大規模言語モデルと翻訳の未来",
    category: "ai",
    categoryLabel: "AI・テクノロジー",
    description: "最先端のNLP研究者として、GPTやその他のLLMが翻訳業界に与える影響と、今後5年間の技術トレンドを予測します。",
  },
  {
    id: 5,
    name: "田中 健一",
    nameEn: "Kenichi Tanaka",
    title: "特許翻訳事務所 所長",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "特許翻訳のクオリティコントロール",
    category: "workshop",
    categoryLabel: "ワークショップ",
    description: "30年以上の特許翻訳経験を活かし、技術文書の正確性と法的要件を両立させる手法について、具体的な事例とともに解説します。",
  },
  {
    id: 6,
    name: "Emma Williams",
    nameEn: "Emma Williams",
    title: "Literary Translator & Author",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "文学翻訳における創造性と忠実性",
    category: "panel",
    categoryLabel: "パネル",
    description: "数々の文学賞を受賞した翻訳者として、原作の魂を守りながら新しい言語で作品を生まれ変わらせる芸術について語ります。",
  },
  {
    id: 7,
    name: "佐藤 由美",
    nameEn: "Yumi Sato",
    title: "映像翻訳家・字幕監修",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "ストリーミング時代の映像翻訳",
    category: "panel",
    categoryLabel: "パネル",
    description: "Netflix、Amazon Primeなどの主要プラットフォームで活躍。デジタル時代における字幕・吹替翻訳の変化と対応策を議論します。",
  },
  {
    id: 8,
    name: "David Kim",
    nameEn: "David Kim",
    title: "CTO, TranslationTech Startup",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    sessionTitle: "機械翻訳APIの実践的活用法",
    category: "ai",
    categoryLabel: "AI・テクノロジー",
    description: "翻訳テクノロジー企業の技術責任者として、MT APIを業務に統合するためのベストプラクティスとピットフォールを共有します。",
  },
];

const CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "keynote", label: "基調講演" },
  { id: "panel", label: "パネル" },
  { id: "workshop", label: "ワークショップ" },
  { id: "ai", label: "AI・テクノロジー" },
];

function getCategoryColor(category: string) {
  switch (category) {
    case "keynote":
      return "bg-red-100 text-red-600";
    case "panel":
      return "bg-purple-100 text-purple-600";
    case "workshop":
      return "bg-green-100 text-green-600";
    case "ai":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function SessionsPage() {
  const [filter, setFilter] = useState("all");
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  const filteredSpeakers =
    filter === "all"
      ? SPEAKERS
      : SPEAKERS.filter((s) => s.category === filter);

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      {/* Hero Section */}
      <header className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-600 mb-4 tracking-wider uppercase">
            Sessions & Speakers
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
            登壇者紹介
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            第35回翻訳祭を彩る、業界のリーダーたち。
          </p>
        </div>
      </header>

      {/* Filter Section */}
      <section className="px-6 max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                filter === cat.id
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              onClick={() => setSelectedSpeaker(speaker)}
              className="bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:translate-y-[-8px] hover:scale-[1.02] hover:shadow-2xl group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={speaker.photo}
                  alt={speaker.name}
                  className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end p-6">
                  <span className="text-white text-sm font-medium">
                    {speaker.sessionTitle}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span
                  className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-3 ${getCategoryColor(
                    speaker.category
                  )}`}
                >
                  {speaker.categoryLabel}
                </span>
                <h3 className="text-lg font-bold mb-1">{speaker.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{speaker.title}</p>
                <p className="text-sm text-gray-700 font-medium line-clamp-2">
                  {speaker.sessionTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selectedSpeaker && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedSpeaker(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedSpeaker(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 flex-shrink-0">
                    <img
                      src={selectedSpeaker.photo}
                      alt={selectedSpeaker.name}
                      className="w-full aspect-square object-cover rounded-2xl"
                    />
                  </div>
                  <div className="flex-grow">
                    <span
                      className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-4 ${getCategoryColor(
                        selectedSpeaker.category
                      )}`}
                    >
                      {selectedSpeaker.categoryLabel}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      {selectedSpeaker.name}
                    </h2>
                    <p className="text-gray-500 mb-6">{selectedSpeaker.title}</p>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                        講演タイトル
                      </p>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedSpeaker.sessionTitle}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedSpeaker.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
