import React from "react";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
    redirect("/login?redirect=/admin/settings");
  }

  const settings = await getSiteSettings();

  return <SettingsClient initialSettings={settings} />;
}
