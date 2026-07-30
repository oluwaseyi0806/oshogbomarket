"use client";
import Link from "next/link";

export default function LiveListingsMarquee({ listings }) {
  if (!listings || listings.length === 0) return null;
  const doubled = listings.concat(listings);

  return (
    <div className="mb-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-950/60">Live in Osogbo now</p>
      </div>
      <div className="flex gap-3 marquee-track">
        {doubled.map(function (listing, i) {
          return (
            <Link key={listing.id + "-" + i} href={"/listings/" + listing.id} className="flex-shrink-0 w-28 bg-white border border-indigo-950/10 rounded-lg overflow-hidden">
              <div className="w-28 h-28 bg-indigo-950/5">
                {listing.images && listing.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="p-1.5">
                <p className="text-[11px] font-semibold text-indigo-950 truncate">{listing.title}</p>
                <p className="text-[11px] text-indigo-900">NGN {listing.price?.toLocaleString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .marquee-track {
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}