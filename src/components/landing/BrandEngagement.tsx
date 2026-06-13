const highlights = [
  {
    stat: '5,000+',
    label: 'Orders Delivered',
    icon: '📦',
    description: 'Worldwide shipping to fashion lovers',
  },
  {
    stat: '98%',
    label: 'Satisfaction',
    icon: '⭐',
    description: 'Customer happiness rate',
  },
  {
    stat: '4.9★',
    label: 'Avg Rating',
    icon: '👥',
    description: 'Verified community reviews',
  },
  {
    stat: '15+',
    label: 'Cities Served',
    icon: '🌍',
    description: 'Across premium metros',
  },
];

const testimonials = [
  {
    quote: "Kalasatra's quality is unmatched. The fabric, fit, and attention to detail elevates my entire wardrobe.",
    author: 'Arjun M.',
    role: 'Verified Buyer',
    rating: 5,
  },
  {
    quote: 'Finally a brand that owns its aesthetic. Every piece feels intentional, premium, and unapologetically bold.',
    author: 'Priya K.',
    role: 'Fashion Enthusiast',
    rating: 5,
  },
  {
    quote: 'The craftsmanship speaks for itself. These pieces are investments in timeless streetwear style.',
    author: 'Rohan S.',
    role: 'Verified Buyer',
    rating: 5,
  },
];

const features = [
  {
    title: 'Premium Materials',
    desc: 'Heavyweight cottons, precision knits, and durable finishes curated for longevity.',
    icon: '◆',
  },
  {
    title: 'Ethical Production',
    desc: 'Certified manufacturers ensuring fair wages, safe conditions, and responsible fashion.',
    icon: '▣',
  },
  {
    title: 'Free Shipping',
    desc: 'Complimentary shipping on all orders above ₹999. Fast, reliable delivery guaranteed.',
    icon: '→',
  },
  {
    title: 'Easy Returns',
    desc: '30-day hassle-free returns. Premium experience from order to aftercare.',
    icon: '↺',
  },
];

export default function BrandEngagement() {
  return (
    <section className="relative py-24 lg:py-40 bg-dark-charcoal overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.05),transparent_70%)]" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-luxury-gold/4 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-luxury-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Stats Section */}
        <div className="mb-28 lg:mb-36">
          <h2 className="font-heading text-3xl font-bold text-soft-white mb-12 uppercase tracking-[0.1rem]">
            Why Choose Kalasatra
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {highlights.map((h, idx) => (
              <div
                key={h.label}
                className="group relative p-6 lg:p-8 bg-rich-black/40 border border-luxury-gold/15 hover:border-luxury-gold/40 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Hover Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative space-y-3">
                  <div className="text-3xl">{h.icon}</div>
                  <div className="font-heading text-4xl lg:text-5xl font-bold text-luxury-gold group-hover:text-gold-light transition-colors duration-300">
                    {h.stat}
                  </div>
                  <p className="text-xs uppercase tracking-[0.15em] text-soft-white/60 font-semibold">
                    {h.label}
                  </p>
                  <p className="text-xs text-soft-white/40 leading-relaxed group-hover:text-soft-white/60 transition-colors duration-300">
                    {h.description}
                  </p>
                </div>

                {/* Corner Detail */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-luxury-gold/10 group-hover:border-luxury-gold/30 transition-colors duration-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-28 lg:mb-36">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Testimonial Heading */}
            <div className="space-y-8 animate-slide-in-left">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 border border-luxury-gold/30 flex items-center justify-center rounded-full">
                  <span className="text-luxury-gold font-bold text-lg">★</span>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-luxury-gold font-semibold">
                  Community Love
                </span>
              </div>

              <h2 className="font-heading text-5xl sm:text-6xl lg:text-6xl font-bold text-soft-white leading-tight">
                What Our
                <span className="block text-luxury-gold">Community Says</span>
              </h2>

              <p className="text-lg text-soft-white/60 leading-relaxed max-w-md">
                Real feedback from real customers who've made Kalasatra part of their identity.
              </p>

              <button className="group inline-flex items-center gap-2 text-luxury-gold font-semibold text-sm uppercase tracking-[0.2em] hover:text-gold-light transition-all">
                <span>Read All Reviews</span>
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
              </button>
            </div>

            {/* Testimonials Cards */}
            <div className="space-y-5 animate-slide-in-right">
              {testimonials.map((t, idx) => (
                <div
                  key={t.author}
                  className="group p-7 lg:p-8 bg-rich-black/50 border border-luxury-gold/15 hover:border-luxury-gold/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]" />

                  <div className="relative space-y-4">
                    {/* Rating */}
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <span key={i} className="text-luxury-gold text-lg">★</span>
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-soft-white/75 text-base leading-relaxed italic font-light">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-2 border-t border-luxury-gold/10">
                      <div className="w-10 h-10 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-luxury-gold">
                          {t.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-soft-white">{t.author}</p>
                        <p className="text-xs text-soft-white/40">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div>
          <h2 className="font-heading text-3xl font-bold text-soft-white mb-12 uppercase tracking-[0.1rem]">
            Premium Promise
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {features.map((f, idx) => (
              <div
                key={f.title}
                className="group relative p-7 lg:p-8 border border-luxury-gold/15 hover:border-luxury-gold/40 transition-all duration-500 bg-rich-black/30 hover:bg-rich-black/60 hover:shadow-[0_0_40px_rgba(212,175,55,0.2)]"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]" />

                {/* Content */}
                <div className="relative space-y-4">
                  <div className="text-3xl text-luxury-gold group-hover:scale-125 transition-transform duration-300">
                    {f.icon}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-soft-white group-hover:text-luxury-gold transition-colors duration-300">
                    {f.title}
                  </h3>

                  <p className="text-sm text-soft-white/60 leading-relaxed group-hover:text-soft-white/80 transition-colors duration-300">
                    {f.desc}
                  </p>
                </div>

                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-luxury-gold/0 group-hover:bg-luxury-gold/40 transition-all duration-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
