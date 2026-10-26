import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { History, Shield } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
    redirect("/login?redirect=/admin/audit-logs");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      admin: { select: { displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Audit Trail</h1>
        <p className="text-xs text-slate-500">
          Immutable historical log of all administrative actions, permission changes, and payout operations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Admin</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {timeAgo(log.createdAt)} ({new Date(log.createdAt).toLocaleTimeString()})
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {log.admin.displayName} (@{log.admin.username})
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{log.targetType}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-md truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
