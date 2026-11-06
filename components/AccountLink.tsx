"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountLink() {
  const [name, setName] = useState("");

  useEffect(() => {
    let cancel = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { signedIn?: boolean; name?: string }) => {
        if (!cancel && data.signedIn && data.name) setName(data.name);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <Link href="/account" className="header-account">
      {name || "Sign in"}
    </Link>
  );
}
