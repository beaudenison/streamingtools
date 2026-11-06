import Link from "next/link";
import AccountPanel from "@/components/account/AccountPanel";
import { viewer } from "@/lib/auth/session";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  ...pageMeta({
    title: "Account",
    description:
      "Sign in to Streaming Tools with Twitch or Kick. Alerts and a saved chat look stay on that sign-in.",
    path: "/account",
  }),
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  setup: "Sign-in is not set up on this server yet.",
  denied: "The sign-in was cancelled.",
  linked: "That channel is already on another sign-in.",
  taken: "Disconnect the channel already here before connecting a different one.",
  failed: "Sign-in did not finish. Try again.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const me = await viewer();
  const error = query.error ? errors[query.error] || "" : "";

  return (
    <main className="main">
      <Link href="/" className="back">
        ← Tools
      </Link>
      <div className="tool-hero">
        <h1>Account</h1>
        <p className="lede">
          One sign-in for Twitch and Kick. No password. Chat Overlay and Alerts keep
          their look here.
        </p>
      </div>
      <AccountPanel viewer={me} error={error} />
    </main>
  );
}
