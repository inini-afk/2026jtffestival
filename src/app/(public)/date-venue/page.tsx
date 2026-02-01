import { Navigation, BackgroundOrbs, Footer } from "@/components";

export const metadata = {
  title: "日程・会場案内 | 第35回 JTF翻訳祭 2026",
  description: "第35回JTF翻訳祭は、横浜で開催されます。詳細なスケジュールと会場情報をご確認ください。",
};

export default function DateVenuePage() {
  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      {/* Header Section */}
      <header className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-600 mb-4 tracking-wider uppercase">
            Date & Venue
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6 text-gradient">
            日程・会場案内
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            第35回JTF翻訳祭は、昨年に続き横浜で開催されます。詳細なスケジュールと会場情報をご確認ください。
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Schedule Section */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-gradient">
            開催スケジュール
          </h2>

          <div className="space-y-8 relative">
            {/* OnDemand */}
            <TimelineItem
              title="オンデマンド配信"
              date="2026年10月1日（木）～ 10月31日（金）"
              description="セッション動画をオンデマンド配信いたします。"
            />

            {/* In-person Event */}
            <TimelineItem
              title="会場開催"
              date="2026年11月13日（金）"
            >
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="text-sm font-medium mb-2">【開催時間】</p>
                <p className="text-sm text-gray-600">開場・受付開始：9時30分</p>
                <p className="text-sm text-gray-600">終了：17時</p>
              </div>
            </TimelineItem>

            {/* Networking Party */}
            <TimelineItem
              title="交流パーティー"
              date="2026年11月13日（金）"
            >
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="text-sm font-medium mb-2">【パーティー時間】</p>
                <p className="text-sm text-gray-600">受付開始：17時30分</p>
                <p className="text-sm text-gray-600">開会：18時</p>
                <p className="text-sm text-gray-600">閉会：20時</p>
              </div>
            </TimelineItem>
          </div>
        </section>

        {/* Venue Section */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-gradient">
            会場情報
          </h2>

          {/* Seminar Venue */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-6">セミナー会場</h3>
            <div className="venue-card">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow">
                  <h4 className="text-xl font-bold mb-2">
                    横浜市開港記念会館（ジャックの塔）
                  </h4>
                  <p className="text-sm text-gray-500 mb-4 font-mono">
                    〒231-0005　横浜市中区本町1丁目6番地
                  </p>

                  <div className="space-y-6">
                    {/* Description */}
                    <InfoBlock
                      icon="fas fa-info-circle"
                      title="施設について"
                    >
                      <p className="text-sm text-gray-600 leading-relaxed">
                        横浜市開港記念会館（通称：ジャックの塔）は、1917年に横浜港開港50周年を記念して建設された歴史的建造物です。辰野式フリークラシック様式の美しいレンガ造りが特徴で、塔の高さは約36メートル。関東大震災で一度焼失するも再建され、1989年には国の重要文化財に指定されました。館内には大正期の面影を残すステンドグラスや講堂があり、一般公開もされています。夜にはライトアップされ、横浜のランドマークとして親しまれています。
                      </p>
                    </InfoBlock>

                    {/* Train Access */}
                    <InfoBlock
                      icon="fas fa-train"
                      title="電車でお越しの方"
                    >
                      <ul className="space-y-2">
                        <li className="text-sm text-gray-600">
                          • みなとみらい線「日本大通り駅」1番出口から徒歩1分（約50m）
                        </li>
                        <li className="text-sm text-gray-600">
                          • 市営地下鉄線「関内駅」1番出口から徒歩10分（約700m）
                        </li>
                        <li className="text-sm text-gray-600">
                          • JR京浜東北線・根岸線「関内駅」南口から徒歩10分（約700m）
                        </li>
                      </ul>
                    </InfoBlock>

                    {/* Bus Access */}
                    <InfoBlock
                      icon="fas fa-bus"
                      title="バスでお越しの方"
                    >
                      <ul className="space-y-2">
                        <li className="text-sm text-gray-600">
                          • 「開港記念会館前」から徒歩1分（約10m）
                        </li>
                        <li className="text-sm text-gray-600">
                          • 「本町1丁目」から徒歩1分（約50m）
                        </li>
                        <li className="text-sm text-gray-600">
                          • 「日本大通り駅・県庁前」から徒歩3分（約200m）
                        </li>
                      </ul>
                    </InfoBlock>

                    {/* Notes */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <p className="text-xs text-gray-600">
                        <i className="fas fa-exclamation-circle text-yellow-600 mr-2"></i>
                        当施設に駐車場はありません
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        <i className="fas fa-exclamation-circle text-yellow-600 mr-2"></i>
                        会館は一般にも開放されているため、イベント参加者以外の来場者もいらっしゃいます。
                      </p>
                    </div>

                    {/* Website */}
                    <div>
                      <a
                        href="https://www.kaikokinenkaikan.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                      >
                        <i className="fas fa-globe"></i>
                        ウェブサイト
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Networking Venue */}
          <div>
            <h3 className="text-2xl font-bold mb-6">交流パーティー会場</h3>
            <div className="venue-card">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow">
                  <h4 className="text-xl font-bold mb-2">ロイヤルホールヨコハマ</h4>
                  <p className="text-sm text-gray-500 mb-4 font-mono">
                    〒231-8544 横浜市中区山下町90番地
                  </p>

                  <div className="space-y-6">
                    {/* Description */}
                    <InfoBlock
                      icon="fas fa-info-circle"
                      title="施設について"
                    >
                      <p className="text-sm text-gray-600 leading-relaxed">
                        ロイヤルホールヨコハマは、横浜・元町中華街エリアにある格式ある結婚式場兼大型ホールです。今回は、代表的な会場「ヴェルサイユの間」にて立食パーティーを予定しております。セミナー会場である横浜市開港記念会館からは、中華街方面へ徒歩約10分の距離にあります。
                      </p>
                    </InfoBlock>

                    {/* Train Access */}
                    <InfoBlock
                      icon="fas fa-train"
                      title="電車でお越しの方"
                    >
                      <ul className="space-y-2">
                        <li className="text-sm text-gray-600">
                          • みなとみらい線「日本大通り駅」情文センター口・出口3より徒歩約2分
                        </li>
                        <li className="text-sm text-gray-600">
                          • JR「関内駅」南口より徒歩約8分
                        </li>
                        <li className="text-sm text-gray-600">
                          • JR「石川町駅」北口より徒歩約7分
                        </li>
                        <li className="text-sm text-gray-600">
                          • 横浜市営地下鉄「関内駅」出口1より徒歩約8分
                        </li>
                        <li className="text-sm text-gray-600">
                          • みなとみらい線「元町・中華街駅」山下公園口より徒歩約5分
                        </li>
                      </ul>
                    </InfoBlock>

                    {/* Taxi Access */}
                    <InfoBlock
                      icon="fas fa-taxi"
                      title="タクシーをご利用の方"
                    >
                      <ul className="space-y-2">
                        <li className="text-sm text-gray-600">
                          • JR「横浜駅」南口から：距離 約4.4km／所要時間 約15分／料金目安 約2,100円
                        </li>
                        <li className="text-sm text-gray-600">
                          • 「羽田空港」から：距離 約24.3km／所要時間 約63分／料金目安 約9,140円
                        </li>
                      </ul>
                    </InfoBlock>

                    {/* Parking */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <i className="fas fa-parking text-blue-600"></i>
                        駐車場のご案内
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">
                        地下駐車場（収容台数：60台、高さ制限：2.2m）
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        営業時間：10:00～21:00
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• 税込2,000円以上のご利用で1時間無料</li>
                        <li>• 税込3,000円以上のご利用で2時間無料（以後30分毎に300円）</li>
                      </ul>
                    </div>

                    {/* Website */}
                    <div>
                      <a
                        href="https://www.royalhall.co.jp/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                      >
                        <i className="fas fa-globe"></i>
                        ウェブサイト
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-gradient">
            アクセスマップ
          </h2>
          <div className="venue-card overflow-hidden p-0">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3250.453238252747!2d139.6400989!3d35.4467867!4m5!3m4!1s0x60185cf6a5ef82f1%3A0x4f4f4ec4d33c5f70!2z5qiq5rWc5biC6ZaL5riv6KiY5b-15Lya6aSo!5e0!3m2!1sja!2sjp!4v1706000000000"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://maps.app.goo.gl/UH3xWEBUL4UdJ7Nn8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-map-marker-alt"></i>
                  Google Mapsで開く
                </a>
                <a
                  href="https://maps.app.goo.gl/UH3xWEBUL4UdJ7Nn8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors"
                >
                  <i className="fas fa-directions"></i>
                  経路を検索
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function TimelineItem({
  title,
  date,
  description,
  children,
}: {
  title: string;
  date: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-6 md:gap-8">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 mt-2"></div>
        <div className="w-0.5 h-full bg-gradient-to-b from-blue-500 to-transparent mt-2"></div>
      </div>
      <div className="flex-grow pb-8">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 font-medium mb-1">{date}</p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <i className={`${icon} text-blue-600`}></i>
        {title}
      </h5>
      {children}
    </div>
  );
}
