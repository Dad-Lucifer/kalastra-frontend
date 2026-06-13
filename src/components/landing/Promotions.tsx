import { useState } from 'react';

export default function Promotions() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="relative py-24 lg:py-40 bg-rich-black overflow-hidden">
      {/* Background Ambiance */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-luxury-gold/[0.02] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-luxury-gold/4 rounded-full blur-[120px] opacity-30" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-luxury-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Promotional Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 mb-16 lg:mb-20">
          {/* New Arrivals Card */}
          <div className="group relative p-10 lg:p-14 border border-luxury-gold/25 bg-gradient-to-br from-luxury-gold/15 via-dark-charcoal to-rich-black overflow-hidden">
            {/* Animated Background */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-luxury-gold/20 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-luxury-gold/30 group-hover:border-luxury-gold/60 transition-colors duration-500" />

            <div className="relative space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-luxury-gold/40 bg-luxury-gold/10">
                <span className="w-2 h-2 rounded-full bg-luxury-gold animate-gold-pulse" />
                <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-gold">
                  Limited Offer
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h3 className="font-heading text-4xl sm:text-5xl lg:text-5xl font-bold text-soft-white leading-tight">
                  New Season,
                  <span className="block bg-gradient-to-r from-luxury-gold to-gold-light bg-clip-text text-transparent">
                    Fresh Drop
                  </span>
                </h3>
              </div>

              {/* Description */}
              <p className="text-soft-white/70 text-base lg:text-lg leading-relaxed max-w-sm font-light">
                Be the first to wear our latest collection. Exclusive pieces handpicked for those who lead.
              </p>

              {/* Countdown */}
              <div className="flex gap-4 text-sm">
                <div className="flex flex-col items-center">
                  <span className="font-heading text-3xl font-bold text-luxury-gold">05</span>
                  <span className="text-xs text-soft-white/40 uppercase tracking-wider">Days</span>
                </div>
                <span className="text-luxury-gold/40">:</span>
                <div className="flex flex-col items-center">
                  <span className="font-heading text-3xl font-bold text-luxury-gold">14</span>
                  <span className="text-xs text-soft-white/40 uppercase tracking-wider">Hours</span>
                </div>
                <span className="text-luxury-gold/40">:</span>
                <div className="flex flex-col items-center">
                  <span className="font-heading text-3xl font-bold text-luxury-gold">22</span>
                  <span className="text-xs text-soft-white/40 uppercase tracking-wider">Mins</span>
                </div>
              </div>

              {/* CTA Button */}
              <button className="group/btn relative inline-flex px-10 py-4 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-sm hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all duration-500">
                <span className="relative z-10">Shop New Arrivals</span>
                <span className="absolute inset-0 bg-gold-light scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left" />
              </button>
            </div>
          </div>

          {/* Insider Club / VIP Card */}
          <div className="group relative p-10 lg:p-14 border border-luxury-gold/15 bg-gradient-to-br from-dark-charcoal via-rich-black to-dark-charcoal overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-20 -right-20 w-80 h-80 border border-luxury-gold/10 rounded-full group-hover:border-luxury-gold/30 transition-colors duration-700" />
            </div>

            {/* Content */}
            <div className="relative space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-luxury-gold/30 bg-luxury-gold/5">
                <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-gold">
                  ★ Members Only
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h3 className="font-heading text-4xl sm:text-5xl lg:text-5xl font-bold text-soft-white leading-tight">
                  Join the
                  <span className="block text-luxury-gold">Inner Circle</span>
                </h3>
              </div>

              {/* Description */}
              <p className="text-soft-white/60 text-base lg:text-lg leading-relaxed max-w-sm">
                Exclusive access to limited drops, VIP pricing, early releases, and insider community.
              </p>

              {/* Perks */}
              <ul className="space-y-3 text-sm text-soft-white/70">
                <li className="flex items-center gap-3">
                  <span className="text-luxury-gold">✦</span>
                  <span>15% off first order</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-luxury-gold">✦</span>
                  <span>Early access to new releases</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-luxury-gold">✦</span>
                  <span>Exclusive member-only items</span>
                </li>
              </ul>

              {/* Subscribe Form */}
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 bg-rich-black/80 border border-luxury-gold/20 text-soft-white text-sm placeholder:text-soft-white/30 outline-none focus:border-luxury-gold/60 transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="group/sub relative px-6 py-3 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.1em] text-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-500 whitespace-nowrap"
                >
                  <span className="relative z-10">
                    {subscribed ? '✓ Joined' : 'Subscribe'}
                  </span>
                  <span className="absolute inset-0 bg-gold-light scale-x-0 group-hover/sub:scale-x-100 transition-transform duration-500 origin-left" />
                </button>
              </form>

              {subscribed && (
                <p className="text-xs text-luxury-gold animate-fade-in-up">
                  Welcome to the Inner Circle! Check your email for exclusive perks.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main CTA Section */}
        <div className="relative text-center p-12 lg:p-20 border border-luxury-gold/15 bg-gradient-to-r from-dark-charcoal/80 via-rich-black/80 to-dark-charcoal/80 overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-luxury-gold/5 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />

          {/* Decorative Elements */}
          <div className="absolute top-0 left-10 w-px h-16 bg-gradient-to-b from-luxury-gold/50 to-transparent" />
          <div className="absolute top-0 right-10 w-px h-16 bg-gradient-to-b from-luxury-gold/50 to-transparent" />
          <div className="absolute bottom-0 left-1/3 w-1/3 h-px bg-gradient-to-r from-transparent via-luxury-gold/30 to-transparent" />

          <div className="relative space-y-8">
            {/* Overline */}
            <div className="inline-flex mx-auto items-center gap-2 px-4 py-2 border border-luxury-gold/30 bg-luxury-gold/10">
              <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-gold">
                Express Yourself
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-soft-white leading-tight">
              Wear Your
              <span className="block bg-gradient-to-r from-luxury-gold via-gold-light to-luxury-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Story
              </span>
            </h2>

            {/* Description */}
            <p className="text-soft-white/60 max-w-3xl mx-auto text-lg lg:text-xl leading-relaxed font-light">
              Kalasatra isn't just clothing—it's a movement. Every stitch carries the weight of
              heritage. Every design speaks to the future. Your identity deserves to be heard.
            </p>

            {/* CTA */}
            <button className="group/cta relative inline-flex px-14 py-5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-base hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] transition-all duration-500">
              <span className="relative z-10">Explore the Full Collection</span>
              <span className="absolute inset-0 bg-gold-light scale-x-0 group-hover/cta:scale-x-100 transition-transform duration-500 origin-left" />
            </button>

            {/* Additional CTA */}
            <p className="text-soft-white/40 text-sm">
              Free shipping on orders over ₹999 | <span className="text-luxury-gold">@kalasatra</span> for inspiration
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
