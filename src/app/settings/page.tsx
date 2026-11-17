import { SettingsForm } from "./SettingsForm";

// Keeps this route out of Vercel's static/CDN cache so the login check in
// src/proxy.ts (Basic Auth) runs on every request instead of being bypassed
// by a cached response.
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsForm />;
}
