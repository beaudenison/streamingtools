import Link from "next/link";
import { pageMeta } from "@/lib/seo";

const privacyDescription =
  "Privacy for Streaming Tools. Portrait Clip keeps videos on your PC. Chat can stay public or save a look after you sign in. Alerts use a Twitch or Kick sign-in.";

export const metadata = pageMeta({
  title: "Privacy",
  description: privacyDescription,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="main">
      <Link href="/" className="back">
        ← Tools
      </Link>

      <div className="tool-hero">
        <h1>Privacy</h1>
        <p className="lede">
          How Portrait Clip and this website handle information. Updated October
          8, 2026.
        </p>
      </div>

      <section className="notes">
        <h2>Portrait Clip</h2>
        <ul>
          <li>The app runs on your Windows PC. It has no account.</li>
          <li>
            Your videos, clips, layouts, and settings stay on that PC. Compile
            uses FFmpeg locally. The app does not upload them.
          </li>
          <li>The app does not include its own analytics.</li>
          <li>
            If you install from the Microsoft Store, Microsoft handles the
            download. That is covered by the{" "}
            <a href="https://privacy.microsoft.com/">Microsoft Privacy Statement</a>.
          </li>
        </ul>
      </section>

      <section className="notes">
        <h2>This website</h2>
        <ul>
          <li>
            Chat Overlay and Portrait Clip work without a sign-in. Alerts, and a
            saved chat look, use Sign in with Twitch or Kick. There is no
            password.
          </li>
          <li>The site does not use advertising or analytics cookies.</li>
          <li>
            The site is hosted by Vercel. Serving a page includes ordinary
            connection data, such as an IP address. Vercel describes that in
            its{" "}
            <a href="https://vercel.com/legal/privacy-policy">privacy policy</a>.
          </li>
        </ul>
      </section>

      <section className="notes">
        <h2>Chat overlay</h2>
        <ul>
          <li>
            You can type a public Twitch or Kick channel name. Your browser
            then loads that channel’s public chat from Twitch or Kick.
          </li>
          <li>
            A Kick channel lookup passes through this site on its way to Kick.
            The channel name is not saved.
          </li>
        </ul>
      </section>

      <section className="notes">
        <h2>Sign-in</h2>
        <ul>
          <li>
            A sign-in stores the Twitch or Kick id, login, and display name, the
            permissions you granted, and encrypted access and refresh tokens.
          </li>
          <li>
            Chat settings store the channel names and the look. The alert settings
            store the look and the overlay key.
          </li>
          <li>
            An alert keeps the name, event type, amount, and message long enough
            for the overlay to show it, then it is deleted. Chat messages are not
            stored.
          </li>
          <li>
            Disconnect and Delete remove the tokens and the webhook subscriptions.
            Disconnecting the last channel deletes the saved chat look and the
            alert link.
          </li>
        </ul>
      </section>

      <section className="notes">
        <h2>Contact</h2>
        <ul>
          <li>
            Questions about this policy:{" "}
            <a href="https://x.com/beaudenison">@beaudenison</a>.
          </li>
        </ul>
      </section>
    </main>
  );
}
