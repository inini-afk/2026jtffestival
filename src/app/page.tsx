import Link from "next/link";
import { Navigation, BackgroundOrbs, Footer } from "@/components";

export default function Home() {
  return (
    <>
      <BackgroundOrbs />
      /<Navigation />

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm md:text-base font-semibold text-blue-600 mb-4 tracking-wider uppercase">
            The 35th JTF Translation Festival
          </p>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight mb-6 text-gradient">
            言葉の壁を超えて、
            <br />
            未来を創る。
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            翻訳の新たな地平線へ。
            <br />
            2026年11月13日（金）会場開催＋オンデマンド配信
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="#contact"
              className="bg-[#0071e3] text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-[#0077ed] transition-colors shadow-lg shadow-blue-500/30"
            >
              最新情報を受け取る
            </Link>
            <a
              href="https://www.34jtffestival2025.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0071e3] px-8 py-3 rounded-full font-medium text-sm hover:underline flex items-center justify-center gap-2"
            >
              2025年のサイトを見る{" "}
              <i className="fas fa-arrow-right text-xs"></i>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-gray-400">
          <i className="fas fa-chevron-down"></i>
        </div>
      </header>

      {/* Concept Section */}
      <section id="concept" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
              伝統と革新の
              <br />
              <span className="text-gray-400">交差点。</span>
            </h2>
          </div>
          <div>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6">
              第35回を迎えるJTF翻訳祭は、これまでの歴史を尊重しつつ、生成AIやテクノロジーとの共生という新たなテーマに挑みます。
            </p>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              翻訳者、通訳者、翻訳会社、クライアント、そしてテクノロジー開発者。
              すべてのステークホルダーが一堂に会する会場開催と、じっくり学べるオンデマンド配信のハイブリッド形式でお届けします。
            </p>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section
        id="features"
        className="py-20 px-6 bg-white rounded-[3rem] mx-2 md:mx-6 shadow-sm border border-gray-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Experience the Future
            </h2>
            <p className="text-gray-500">2026年の翻訳祭が提供する体験。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* Large Card: On-site */}
            <div className="bento-card md:col-span-2 md:row-span-1 bg-gray-50 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-building text-9xl"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase mb-2">
                  On-site Event
                </p>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  会場開催
                  <span className="text-lg font-normal text-gray-400 ml-2">
                    11/13（金）
                  </span>
                </h3>
                <p className="text-gray-600 max-w-lg">
                  基調講演と交流イベントを会場で開催。スポンサーセミナーやブース展示も無料でご参加いただけます。会場ならではの出会いと対話をお楽しみください。
                </p>
              </div>
            </div>

            {/* Small Card: Networking */}
            <div className="bento-card bg-black text-white rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <i className="fas fa-users text-3xl mb-4 text-gray-400"></i>
                <h3 className="text-2xl font-bold mb-2">Networking</h3>
                <p className="text-gray-400 text-sm">
                  基調講演後の交流パーティーで、業界の仲間とつながる。
                </p>
              </div>
            </div>

            {/* Large Card: On-demand */}
            <div className="bento-card md:col-span-2 md:row-span-1 bg-gray-50 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-play-circle text-9xl"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase mb-2">
                  On-demand
                </p>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  オンデマンド配信
                </h3>
                <p className="text-gray-600 max-w-lg">
                  すべてのセミナーをオンデマンドで配信。AI活用、専門分野の深掘り、ビジネス戦略など、自分のペースでじっくり学べます。
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/sessions"
                  className="inline-flex items-center text-blue-600 font-medium hover:translate-x-1 transition-transform"
                >
                  セッション一覧を見る{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </Link>
              </div>
            </div>

            {/* Small Card: Exhibition */}
            <div className="bento-card bg-gray-50 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <i className="fas fa-cube text-3xl mb-4 text-blue-500"></i>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  Exhibition
                </h3>
                <p className="text-gray-600 text-sm">
                  スポンサーブースで最新の翻訳支援ツールやサービスを体験。入場無料。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-20 px-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 text-center">
            Latest News
          </h2>

          {/* News Items (Static for now, will be replaced with CMS data) */}
          <div className="space-y-6">
            <NewsItem
              date="2026/04/01"
              category="重要"
              categoryClass="bg-red-100 text-red-600"
              title="第35回翻訳祭の公式サイト（ティザー版）を公開しました"
            />
            <NewsItem
              date="2026/05/15"
              category="お知らせ"
              categoryClass="bg-gray-100 text-gray-600"
              title="セッション情報を更新しました"
            />
            <NewsItem
              date="2026/06/01"
              category="イベント"
              categoryClass="bg-blue-100 text-blue-600"
              title="早期割引チケットの販売について"
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="#"
              className="inline-flex items-center text-blue-600 font-medium hover:underline"
            >
              すべてのお知らせを見る{" "}
              <i className="fas fa-arrow-right ml-2 text-xs"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Special Thanks to
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Sponsors
            </h2>
          </div>

          {/* Diamond Sponsors */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-cyan-300"></div>
              <span className="text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Diamond
              </span>
              <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-purple-300"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {/* Diamond sponsor placeholders - largest size */}
              <SponsorLogo
                tier="diamond"
                name="ダイヤモンドスポンサー A"
                logo="/sponsors/diamond/sponsor-a.png"
              />
              <SponsorLogo
                tier="diamond"
                name="ダイヤモンドスポンサー B"
                logo="/sponsors/diamond/sponsor-b.png"
              />
            </div>
          </div>

          {/* Gold Sponsors */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-amber-300"></div>
              <span className="text-sm font-bold uppercase tracking-widest text-amber-500">
                Gold
              </span>
              <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-amber-300"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {/* Gold sponsor placeholders - medium size */}
              <SponsorLogo
                tier="gold"
                name="ゴールドスポンサー A"
                logo="/sponsors/gold/sponsor-a.png"
              />
              <SponsorLogo
                tier="gold"
                name="ゴールドスポンサー B"
                logo="/sponsors/gold/sponsor-b.png"
              />
              <SponsorLogo
                tier="gold"
                name="ゴールドスポンサー C"
                logo="/sponsors/gold/sponsor-c.png"
              />
            </div>
          </div>

          {/* Silver Sponsors */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
              <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Silver
              </span>
              <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {/* Silver sponsor placeholders - smaller size */}
              <SponsorLogo
                tier="silver"
                name="シルバースポンサー A"
                logo="/sponsors/silver/sponsor-a.png"
              />
              <SponsorLogo
                tier="silver"
                name="シルバースポンサー B"
                logo="/sponsors/silver/sponsor-b.png"
              />
              <SponsorLogo
                tier="silver"
                name="シルバースポンサー C"
                logo="/sponsors/silver/sponsor-c.png"
              />
              <SponsorLogo
                tier="silver"
                name="シルバースポンサー D"
                logo="/sponsors/silver/sponsor-d.png"
              />
              <SponsorLogo
                tier="silver"
                name="シルバースポンサー E"
                logo="/sponsors/silver/sponsor-e.png"
              />
            </div>
          </div>

          {/* Become a Sponsor CTA */}
          <div className="text-center mt-16 pt-12 border-t border-gray-100">
            <p className="text-gray-500 mb-4">スポンサーシップについてのお問い合わせ</p>
            <a
              href="mailto:sponsor@jtf.jp"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
            >
              sponsor@jtf.jp
              <i className="fas fa-arrow-right text-xs"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Archive Section */}
      <section
        id="archive"
        className="py-20 px-6 max-w-3xl mx-auto border-t border-gray-200"
      >
        <div>
          <InfoRow label="会場開催" value="2026年11月13日（金）" />
          <InfoRow label="オンデマンド" value="日程調整中" />
          <InfoRow label="会場" value="横浜市開港記念会館（ジャックの塔）" />
          <InfoRow label="主催" value="一般社団法人 日本翻訳連盟 (JTF)" />
        </div>
      </section>

      <Footer />
    </>
  );
}

function NewsItem({
  date,
  category,
  categoryClass,
  title,
}: {
  date: string;
  category: string;
  categoryClass: string;
  title: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-4 cursor-pointer">
      <div className="flex items-center gap-3 min-w-fit">
        <span className="text-sm text-gray-400 font-mono">{date}</span>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${categoryClass}`}
        >
          {category}
        </span>
      </div>
      <h3 className="font-medium text-gray-800 flex-grow">{title}</h3>
      <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 border-b border-gray-100">
      <span className="text-gray-400 font-medium w-32">{label}</span>
      <span className="text-xl font-bold mt-2 md:mt-0">{value}</span>
    </div>
  );
}

function SponsorLogo({
  tier,
  name,
  logo,
  url,
}: {
  tier: "diamond" | "gold" | "silver";
  name: string;
  logo: string;
  url?: string;
}) {
  const sizeClasses = {
    diamond: "w-64 h-32 md:w-80 md:h-40",
    gold: "w-48 h-24 md:w-56 md:h-28",
    silver: "w-36 h-18 md:w-44 md:h-22",
  };

  const containerClasses = {
    diamond:
      "bg-gradient-to-br from-slate-50 via-white to-blue-50 border-2 border-transparent bg-clip-padding shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 hover:scale-105",
    gold:
      "bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/50 border border-amber-100/50 shadow-md hover:shadow-lg hover:shadow-amber-100/50 hover:scale-105",
    silver:
      "bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-105",
  };

  const content = (
    <div
      className={`
        ${sizeClasses[tier]}
        ${containerClasses[tier]}
        rounded-2xl p-4 md:p-6
        flex items-center justify-center
        transition-all duration-300 ease-out
        group cursor-pointer
      `}
      title={name}
    >
      {/* Placeholder - replace with actual Image component when logos are available */}
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`
            ${tier === "diamond" ? "w-16 h-16 md:w-20 md:h-20" : tier === "gold" ? "w-12 h-12 md:w-14 md:h-14" : "w-10 h-10 md:w-12 md:h-12"}
            rounded-xl bg-gray-100 flex items-center justify-center mb-2
            group-hover:bg-gray-200 transition-colors
          `}
        >
          <i
            className={`fas fa-building ${tier === "diamond" ? "text-2xl md:text-3xl" : tier === "gold" ? "text-xl md:text-2xl" : "text-lg md:text-xl"} text-gray-300`}
          ></i>
        </div>
        <span
          className={`
            ${tier === "diamond" ? "text-xs md:text-sm" : "text-xs"}
            text-gray-400 font-medium truncate max-w-full px-2
          `}
        >
          {name}
        </span>
      </div>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
