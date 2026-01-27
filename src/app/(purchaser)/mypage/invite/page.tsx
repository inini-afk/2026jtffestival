"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getMyTickets, TicketWithType } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<TicketWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTickets() {
      if (!user) return;

      try {
        const ticketData = await getMyTickets();
        setTickets(ticketData);
      } catch (error) {
        console.error("Error loading tickets:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadTickets();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleInvite = async (ticketId: string) => {
    const email = inviteEmail[ticketId];
    if (!email) {
      setMessage({ type: "error", text: "メールアドレスを入力してください" });
      return;
    }

    setInviting((prev) => ({ ...prev, [ticketId]: true }));
    setMessage(null);

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "招待に失敗しました");
      }

      // Update ticket status in local state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "invited" as const, invite_email: email }
            : t
        )
      );

      // Save invite URL for dev testing
      if (data.inviteUrl) {
        setInviteUrls((prev) => ({ ...prev, [ticketId]: data.inviteUrl }));
      }

      setMessage({ type: "success", text: `${email} に招待を送信しました` });
      setInviteEmail((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (error) {
      console.error("Invite error:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setInviting((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unassigned: "bg-gray-100 text-gray-800",
      invited: "bg-blue-100 text-blue-800",
      assigned: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      unassigned: "未割当",
      invited: "招待中",
      assigned: "割当済",
    };
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.unassigned}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unassignedTickets = tickets.filter((t) => t.status === "unassigned");
  const invitedTickets = tickets.filter((t) => t.status === "invited");
  const assignedTickets = tickets.filter((t) => t.status === "assigned");

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/mypage"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← マイページに戻る
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">参加者を招待</h1>
            <p className="text-gray-500">
              購入したチケットに参加者を招待できます
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-4">チケットがありません</p>
              <Link
                href="/ticket"
                className="inline-block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
              >
                チケットを購入する
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Unassigned Tickets */}
              {unassignedTickets.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4">
                    招待可能なチケット（{unassignedTickets.length}枚）
                  </h2>
                  <div className="space-y-4">
                    {unassignedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="info-card rounded-2xl p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-500">
                                {ticket.ticket_number}
                              </span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="font-medium">
                              {ticket.ticket_type?.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                          <input
                            type="email"
                            placeholder="招待するメールアドレス"
                            value={inviteEmail[ticket.id] || ""}
                            onChange={(e) =>
                              setInviteEmail((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleInvite(ticket.id)}
                            disabled={inviting[ticket.id]}
                            className="px-6 py-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ed] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {inviting[ticket.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>送信中...</span>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-paper-plane"></i>
                                <span>招待する</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invited Tickets */}
              {invitedTickets.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4">
                    招待中（{invitedTickets.length}枚）
                  </h2>
                  <div className="space-y-4">
                    {invitedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="info-card rounded-2xl p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-500">
                                {ticket.ticket_number}
                              </span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="font-medium">
                              {ticket.ticket_type?.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              招待先: {ticket.invite_email}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            登録待ち
                          </div>
                        </div>
                        {/* Dev mode: show invite URL */}
                        {inviteUrls[ticket.id] && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                            <p className="font-medium text-yellow-800 mb-1">
                              開発用招待URL:
                            </p>
                            <a
                              href={inviteUrls[ticket.id]}
                              className="text-blue-600 break-all hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {inviteUrls[ticket.id]}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Tickets */}
              {assignedTickets.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-4">
                    割当済（{assignedTickets.length}枚）
                  </h2>
                  <div className="space-y-4">
                    {assignedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="info-card rounded-2xl p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-500">
                                {ticket.ticket_number}
                              </span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="font-medium">
                              {ticket.ticket_type?.name}
                            </p>
                          </div>
                          <div className="text-sm text-green-600">
                            <i className="fas fa-check-circle mr-1"></i>
                            参加者登録済み
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
