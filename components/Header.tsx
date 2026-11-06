import Link from "next/link";
import AccountLink from "@/components/AccountLink";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Streaming Tools</span>
        </Link>
        <AccountLink />
      </div>
    </header>
  );
}
