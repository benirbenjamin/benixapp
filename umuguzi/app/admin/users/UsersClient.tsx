"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Search, ShieldCheck, Ban, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (targetUserId: string, action: string, role?: string) => {
    setUpdatingId(targetUserId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, role }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUsers(users.map((u) => (u.id === targetUserId ? { ...u, ...data.user } : u)));
      }
    } catch {
      alert("Failed to update user status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (targetUser.email.toLowerCase() === "benirabok@gmail.com") {
      alert("The primary Super Admin (benirabok@gmail.com) is permanently protected and cannot be deleted.");
      return;
    }

    const isTargetAdmin = targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN" || targetUser.role === "MODERATOR";
    const confirmMsg = isTargetAdmin
      ? `⚠️ WARNING: You are about to permanently delete an ADMINISTRATOR account (${targetUser.displayName} - ${targetUser.email}). Proceed?`
      : `Are you sure you want to permanently delete ${targetUser.displayName} (@${targetUser.username})? This action cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    setUpdatingId(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id, action: "DELETE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers(users.filter((u) => u.id !== targetUser.id));
      alert("User account has been permanently removed.");
    } catch (err: any) {
      alert(err.message || "Failed to delete user account.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500">
            Control member privileges, verify accounts, assign roles, and handle suspensions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, username..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 group">
                      <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 group-hover:text-brand transition-colors">{u.displayName}</span>
                          {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-brand" />}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          @{u.username} &bull; {u.email}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleAction(u.id, "CHANGE_ROLE", e.target.value)}
                      disabled={updatingId === u.id}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold bg-white"
                    >
                      <option value="USER">USER</option>
                      <option value="CREATOR">CREATOR</option>
                      <option value="PROVIDER">PROVIDER</option>
                      <option value="AFFILIATE">AFFILIATE</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    {u.isBanned ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-400">{timeAgo(u.createdAt)}</td>

                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-brand text-white font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                      title="View user details & analytics"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Analytics</span>
                    </Link>

                    {u.email.toLowerCase() === "benirabok@gmail.com" ? (
                      <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        ⭐ Protected Super Admin
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(u.id, u.isVerified ? "UNVERIFY" : "VERIFY")}
                          disabled={updatingId === u.id}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px]"
                        >
                          {u.isVerified ? "Unverify" : "Verify Badge"}
                        </button>

                        <button
                          onClick={() => handleAction(u.id, u.isBanned ? "UNBAN" : "BAN")}
                          disabled={updatingId === u.id}
                          className={`px-2.5 py-1 font-semibold rounded-lg text-[11px] ${
                            u.isBanned
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          {u.isBanned ? "Lift Ban" : "Suspend"}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={updatingId === u.id}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-[11px] transition-colors"
                          title="Permanently delete user or admin"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
