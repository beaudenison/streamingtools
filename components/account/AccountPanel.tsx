"use client";

import type { Viewer } from "@/lib/auth/session";

export default function AccountPanel({
  viewer,
  error,
}: {
  viewer: Viewer | null;
  error: string;
}) {
  if (!viewer) {
    return (
      <div className="account-block">
        {error ? <p className="hint">{error}</p> : null}
        <p className="lede">
          Sign in with Twitch or Kick. Alerts can then use follows, subs, raids, cheers,
          and KICKs. Chat keeps one saved look, so the OBS link stays the same.
        </p>
        <div className="actions">
          <a className="btn" href="/api/auth/twitch?return=/account">
            Sign in with Twitch
          </a>
          <a className="btn btn-ghost" href="/api/auth/kick?return=/account">
            Sign in with Kick
          </a>
        </div>
      </div>
    );
  }

  const connected = [viewer.twitch, viewer.kick].filter(Boolean).length;

  return (
    <div className="account-block">
      {error ? <p className="hint">{error}</p> : null}
      <Channel
        name="Twitch"
        platform="twitch"
        link={viewer.twitch}
        last={connected === 1 && Boolean(viewer.twitch)}
      />
      <Channel
        name="Kick"
        platform="kick"
        link={viewer.kick}
        last={connected === 1 && Boolean(viewer.kick)}
      />
      <div className="actions">
        <form action="/api/auth/sign-out" method="post">
          <button className="btn btn-ghost" type="submit">
            Sign out
          </button>
        </form>
        <form
          action="/api/account/delete"
          method="post"
          onSubmit={(event) => {
            if (!confirm("Delete this sign-in, the saved chat look, and the alert link?")) {
              event.preventDefault();
            }
          }}
        >
          <button className="btn btn-ghost" type="submit">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function Channel({
  name,
  platform,
  link,
  last,
}: {
  name: string;
  platform: "twitch" | "kick";
  link: Viewer["twitch"];
  last: boolean;
}) {
  return (
    <section className="notes">
      <h2>{name}</h2>
      {link ? (
        <>
          <p>{link.displayName}</p>
          {link.needsReauth ? <p className="hint">Connect again to keep alerts coming.</p> : null}
          {link.lastError ? <p className="hint">{link.lastError}</p> : null}
          <form
            action="/api/account/disconnect"
            method="post"
            onSubmit={(event) => {
              if (!last) return;
              if (
                !confirm(
                  "This is the last channel. Disconnecting deletes the saved chat look and the alert link.",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="platform" value={platform} />
            <button className="btn btn-ghost" type="submit">
              Disconnect
            </button>
          </form>
        </>
      ) : (
        <a className="btn" href={`/api/auth/${platform}?return=/account`}>
          Connect {name}
        </a>
      )}
    </section>
  );
}
