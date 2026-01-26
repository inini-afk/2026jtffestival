"use client";

import Link from "next/link";

export default function Footer() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("デモサイトのため登録機能はありません。");
  };

  return (
    <footer id="contact" className="bg-[#1d1d1f] text-white py-24 px-6 mt-20">
      <div className="max-w-4xl mx-auto text-center">
        <i className="fas fa-paper-plane text-4xl mb-6 text-gray-500"></i>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Stay Updated.</h2>
        <p className="text-gray-400 mb-10 max-w-xl mx-auto">
          開催日程やイベント情報をいち早くお届けします。
          <br />
          メールアドレスを登録して、続報をお待ちください。
        </p>

        <form
          className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto mb-16"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="メールアドレス"
            className="px-6 py-4 rounded-full bg-gray-800 text-white border-none focus:ring-2 focus:ring-blue-500 outline-none w-full"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-colors whitespace-nowrap"
          >
            登録する
          </button>
        </form>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; 2026 Japan Translation Federation. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
