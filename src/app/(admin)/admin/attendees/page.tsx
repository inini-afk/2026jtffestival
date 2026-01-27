"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getAllAttendees } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";
import type { AdminAttendee } from "@/lib/services/admin";

export default function AdminAttendeesPage() {
  const { user, loading } = useAuth();
  const [attendees, setAttendees] = useState<AdminAttendee[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getAllAttendees();
        setAttendees(data);
      } catch (error) {
        console.error("Error loading attendees:", error);
      } finally {
        setDataLoading(false);
      }
    }
    if (!loading && user) loadData();
    else if (!loading) setDataLoading(false);
  }, [user, loading]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unassigned: "bg-yellow-100 text-yellow-800",
      invited: "bg-blue-100 text-blue-800",
      assigned: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      unassigned: "未割当",
      invited: "招待済み",
      assigned: "割当済み",
    };
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      <BackgroundOrbs />
      <Navigation />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">参加者一覧</h1>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
              ← 管理画面に戻る
            </Link>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-500">参加者データがありません</p>
            </div>
          ) : (
            <div className="info-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left p-4 font-medium text-gray-600">チケット番号</th>
                      <th className="text-left p-4 font-medium text-gray-600">参加者</th>
                      <th className="text-left p-4 font-medium text-gray-600">所属</th>
                      <th className="text-left p-4 font-medium text-gray-600">チケット種別</th>
                      <th className="text-center p-4 font-medium text-gray-600">区分</th>
                      <th className="text-center p-4 font-medium text-gray-600">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a) => (
                      <tr key={a.ticket_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-4 font-mono text-xs">{a.ticket_number}</td>
                        <td className="p-4">
                          <div>{a.attendee_name || a.purchaser_name}</div>
                          <div className="text-xs text-gray-400">
                            {a.attendee_email || a.purchaser_email}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500">{a.attendee_company || "-"}</td>
                        <td className="p-4">{a.ticket_type_name}</td>
                        <td className="p-4 text-center">
                          <span className="text-xs">
                            {a.is_purchaser ? "申込者" : "招待者"}
                          </span>
                        </td>
                        <td className="p-4 text-center">{getStatusBadge(a.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
