"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Navigation, BackgroundOrbs } from "@/components";

interface InviteInfo {
  ticketNumber: string;
  ticketTypeName: string;
  purchaserName: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInviteInfo() {
      try {
        const response = await fetch(`/api/invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "招待情報の取得に失敗しました");
        }

        setInviteInfo(data);
        if (data.inviteEmail) {
          setEmail(data.inviteEmail);
        }
      } catch (err) {
        console.error("Error loading invite:", err);
        setError(
          err instanceof Error ? err.message : "招待情報の取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    }

    loadInviteInfo();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError("お名前を入力してください");
      return;
    }
    if (!email.trim()) {
      setFormError("メールアドレスを入力してください");
      return;
    }
    if (password.length < 6) {
      setFormError("パスワードは6文字以上で入力してください");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("パスワードが一致しません");
      return;
    }

    setIsRegistering(true);

    try {
      const supabase = createClient();

      // Register user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company: company || null,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("ユーザー登録に失敗しました");
      }

      // Accept invite
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authData.user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "招待の受け入れに失敗しました");
      }

      // Redirect to attendee page
      router.push("/attendee?welcome=true");
    } catch (err) {
      console.error("Registration error:", err);
      setFormError(
        err instanceof Error ? err.message : "登録に失敗しました"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <BackgroundOrbs />
        <Navigation />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="info-card rounded-2xl p-12">
              <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
              <h1 className="text-xl font-bold mb-2">招待が無効です</h1>
              <p className="text-gray-500 mb-6">{error}</p>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800"
              >
                トップページへ
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-md mx-auto">
          {/* Invite Info */}
          <div className="info-card rounded-2xl p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-ticket-alt text-2xl text-green-600"></i>
            </div>
            <h1 className="text-xl font-bold mb-2">招待を受け取りました</h1>
            <p className="text-gray-500 mb-4">
              JTF翻訳祭2026への参加招待が届いています
            </p>
            {inviteInfo && (
              <div className="bg-gray-50 rounded-xl p-4 text-left">
                <div className="text-sm text-gray-500 mb-1">チケット</div>
                <div className="font-medium">{inviteInfo.ticketTypeName}</div>
                <div className="font-mono text-sm text-gray-500 mt-1">
                  {inviteInfo.ticketNumber}
                </div>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <div className="info-card rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">アカウント登録</h2>
            <p className="text-sm text-gray-500 mb-6">
              チケットを受け取るにはアカウント登録が必要です
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  会社名・所属
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="株式会社〇〇"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  パスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6文字以上"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  パスワード（確認） <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="もう一度入力"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-[#0071e3] text-white py-3 rounded-xl font-medium hover:bg-[#0077ed] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>登録中...</span>
                  </>
                ) : (
                  <span>登録してチケットを受け取る</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              既にアカウントをお持ちの方は
              <Link
                href={`/login?redirect=/invite/${token}`}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
