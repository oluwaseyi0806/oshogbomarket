export default function LegalPage() {
  return (
    <div className="max-w-2xl mx-auto prose prose-sm">
      <h1 className="font-display font-bold text-2xl text-indigo-950 mb-4">Terms of Use and Privacy</h1>

      <h2 className="font-display font-bold text-lg text-indigo-950 mt-6">Terms of Use</h2>
      <p className="text-indigo-950/80">
        OshogboMarket is a platform connecting buyers and sellers in Osogbo. We do not process payments and are not
        a party to any transaction between users. All trades are arranged directly between buyers and sellers, at
        their own risk. Meet in safe, public locations when exchanging goods and money.
      </p>
      <p className="text-indigo-950/80">
        Listings must be honest and accurate. Scams, counterfeit goods, stolen goods, or illegal items are not
        permitted and will be removed, with the responsible account banned.
      </p>

      <h2 className="font-display font-bold text-lg text-indigo-950 mt-6">Privacy</h2>
      <p className="text-indigo-950/80">
        We store your name, email, WhatsApp number, and any listings or photos you post, in order to operate the
        marketplace and let buyers/sellers contact each other. Your WhatsApp number is shown publicly on listings
        you post, since that is how buyers and sellers connect. We do not sell your data to third parties.
      </p>
      <p className="text-indigo-950/80">
        If you would like your account and data deleted, contact us and we will remove it.
      </p>
    </div>
  );
}