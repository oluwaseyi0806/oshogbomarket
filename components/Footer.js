import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 mb-20 border-t border-indigo-950/10 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-indigo-950/50">
        <p>OshogboMarket - buy and sell in Osogbo.</p>
        <Link href="/legal" className="underline">Terms and Privacy</Link>
      </div>
    </footer>
  );
}