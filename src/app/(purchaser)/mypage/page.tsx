"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { Navigation, BackgroundOrbs } from "@/components";

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get user metadata
  const userName = user?.user_metadata?.name || "ユーザー";
  const userCompany = user?.user_metadata?.company;
  const userEmail = user?.email;

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* User Header */}
          <div className="info-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{userName} さん</h1>
                {userCompany && (
                  <p className="text-gray-500">{userCompany}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">{userEmail}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-500">購入チケット</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-500">招待済み</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-500">視聴可能セッション</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buy Ticket */}
            <Link
              href="/ticket"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-ticket-alt text-blue-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-blue-600 transition-colors">
                    チケットを購入
                  </h3>
                  <p className="text-sm text-gray-500">
                    会場参加、オンデマンド視聴など
                  </p>
                </div>
              </div>
            </Link>

            {/* View Sessions */}
            <Link
              href="/sessions"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-play-circle text-purple-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-purple-600 transition-colors">
                    セッション一覧
                  </h3>
                  <p className="text-sm text-gray-500">
                    登壇者とセッション内容を確認
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* No Tickets Message */}
          <div className="mt-8 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 mb-4">
              まだチケットを購入していません
            </p>
            <Link
              href="/ticket"
              className="inline-block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
            >
              チケットを購入する
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
