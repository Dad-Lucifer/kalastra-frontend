const values = [
  {
    title: 'Craftsmanship',
    desc: 'Every stitch, cut, and finish is meticulously crafted to meet the highest standards of quality and durability.',
    icon: '✦',
    num: '01',
  },
  {
    title: 'Heritage',
    desc: 'Rooted in cultural richness, we weave tradition into modern streetwear silhouettes.',
    icon: '◆',
    num: '02',
  },
  {
    title: 'Identity',
    desc: 'Our designs empower you to express your authentic self without compromise.',
    icon: '◈',
    num: '03',
  },
  {
    title: 'Sustainability',
    desc: 'Committed to ethical production, sustainable materials, and responsible fashion.',
    icon: '◇',
    num: '04',
  },
];

export default function BrandStory() {
  return (
    <section id="story" className="relative py-24 lg:py-40 bg-dark-charcoal overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_80%)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-luxury-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-luxury-gold/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-luxury-gold/5 rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header Section */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center mb-24 lg:mb-32">
          <div className="space-y-8 animate-slide-in-left">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 border border-luxury-gold/30 flex items-center justify-center rounded-full">
                <span className="text-luxury-gold font-bold text-lg">◆</span>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-luxury-gold font-semibold">
                Our Legacy
              </span>
            </div>

            <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-soft-white space-y-2">
              <span className="block">Where Heritage</span>
              <span className="block">Meets</span>
              <span className="bg-gradient-to-r from-luxury-gold via-gold-light to-luxury-gold bg-clip-text text-transparent">
                Street Culture
              </span>
            </h2>

            <div className="w-20 h-1 bg-gradient-to-r from-luxury-gold to-transparent" />
          </div>

          <div className="space-y-7 animate-slide-in-right">
            <p className="text-lg lg:text-xl text-soft-white/75 leading-relaxed font-light">
              Kalasatra was born from a vision to bridge the gap between timeless cultural
              artistry and the raw energy of streetwear. We don't just make clothes — we
              craft statements of identity and rebellion.
            </p>
            
            <p className="text-base lg:text-lg text-soft-white/60 leading-relaxed">
              From the bustling markets of heritage cities to the vibrant streets of modern
              fashion capitals, our designs draw inspiration from the intersection of
              tradition and contemporary street consciousness.
            </p>

            <div className="flex items-center gap-6 pt-4">
              <button className="group inline-flex items-center gap-3 text-luxury-gold font-semibold text-sm uppercase tracking-[0.2em] hover:text-gold-light transition-all duration-300">
                <span>Read Our Manifesto</span>
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-2 group-hover:text-gold-light">
                  →
                </span>
              </button>
              <div className="hidden sm:block w-10 h-px bg-luxury-gold/20" />
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="space-y-4 mb-2">
          <h3 className="font-heading text-3xl font-bold text-soft-white uppercase tracking-[0.15em]">
            Our Foundation
          </h3>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {values.map((v, idx) => (
            <div
              key={v.title}
              className="group relative p-8 lg:p-7 bg-rich-black/40 border border-luxury-gold/15 hover:border-luxury-gold/40 transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Corner decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-luxury-gold/10 group-hover:border-luxury-gold/30 transition-colors duration-500" />
              
              {/* Number */}
              <div className="absolute -top-2 -left-2 font-heading text-6xl font-bold text-luxury-gold/5 group-hover:text-luxury-gold/15 transition-all duration-500 pointer-events-none">
                {v.num}
              </div>

              {/* Content */}
              <div className="relative space-y-4">
                <div className="w-10 h-10 flex items-center justify-center border border-luxury-gold/30 rounded-full">
                  <span className="text-lg text-luxury-gold group-hover:scale-125 transition-transform duration-300">
                    {v.icon}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold text-soft-white group-hover:text-luxury-gold transition-colors duration-300">
                  {v.title}
                </h3>

                <p className="text-sm text-soft-white/60 leading-relaxed group-hover:text-soft-white/80 transition-colors duration-300">
                  {v.desc}
                </p>
              </div>

              {/* Bottom border accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-luxury-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
