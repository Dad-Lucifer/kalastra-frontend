import { useState } from 'react';

const categories = [
  {
    id: 'men',
    title: "Men's Collection",
    tagline: 'Bold. Sharp. Unapologetic.',
    description: 'Premium streetwear designed for men who make their own rules. Oversized cuts, premium fabrics, and timeless silhouettes.',
    icon: '▣',
    gradient: 'from-blue-950/60 to-rich-black',
    accentBg: 'from-blue-500/10 to-transparent',
    items: [
      { name: 'Oversized Tee', price: '₹1,299', category: 'Essential' },
      { name: 'Cargo Joggers', price: '₹2,499', category: 'Premium' },
      { name: 'Bomber Jacket', price: '₹3,999', category: 'Statement' },
    ],
  },
  {
    id: 'women',
    title: "Women's Collection",
    tagline: 'Elegance meets edge.',
    description: 'Sophisticated designs that celebrate bold femininity. Cropped silhouettes, precision tailoring, and fearless aesthetics.',
    icon: '◈',
    gradient: 'from-rose-950/60 to-rich-black',
    accentBg: 'from-rose-500/10 to-transparent',
    items: [
      { name: 'Cropped Hoodie', price: '₹1,799', category: 'Premium' },
      { name: 'High-Waist Cargos', price: '₹2,299', category: 'Statement' },
      { name: 'Statement Tee', price: '₹1,199', category: 'Essential' },
    ],
  },
  {
    id: 'kids',
    title: "Kids Collection",
    tagline: 'Mini style, maximum attitude.',
    description: 'Comfortable, cool designs for the young and fearless. Let them express themselves without blending in.',
    icon: '◎',
    gradient: 'from-amber-950/60 to-rich-black',
    accentBg: 'from-amber-500/10 to-transparent',
    items: [
      { name: 'Mini Hoodie', price: '₹999', category: 'Essential' },
      { name: 'Jogger Set', price: '₹1,499', category: 'Premium' },
      { name: 'Graphic Tee', price: '₹699', category: 'Essential' },
    ],
  },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState('men');

  const current = categories.find((c) => c.id === activeTab)!;

  return (
    <section id="collections" className="relative py-24 lg:py-40 bg-rich-black overflow-hidden">
      {/* Background Ambiance */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.04),transparent_60%)]" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-luxury-gold/3 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-luxury-gold/3 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-luxury-gold/20 bg-luxury-gold/5">
            <span className="text-xs uppercase tracking-[0.2em] text-luxury-gold font-semibold">★ Featured Collections</span>
          </div>
          <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-soft-white mb-6 leading-tight">
            Our Latest
            <span className="block bg-linear-to-r from-luxury-gold to-gold-light bg-clip-text text-transparent"> Drops</span>
          </h2>
          <p className="text-lg text-soft-white/60 max-w-2xl mx-auto leading-relaxed">
            Carefully curated collections for every identity. Explore streetwear that tells your story.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-16 p-2 bg-linear-to-r from-dark-charcoal/50 via-dark-charcoal to-dark-charcoal/50 border border-luxury-gold/10 w-fit mx-auto backdrop-blur-sm">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`group relative px-8 py-3 font-semibold uppercase tracking-[0.15em] text-sm transition-all duration-500 ${
                activeTab === cat.id
                  ? 'bg-luxury-gold text-rich-black shadow-lg shadow-luxury-gold/30'
                  : 'text-soft-white/60 hover:text-soft-white'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                {cat.title.split(' ')[0]}
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-px bg-luxury-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
          ))}
        </div>

        {/* Featured Hero Box */}
        <div className="mb-16 lg:mb-20 relative overflow-hidden group">
          <div className={`relative h-80 sm:h-96 lg:h-[450px] bg-linear-to-br ${current.gradient} overflow-hidden`}>
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-linear-to-br ${current.accentBg}`} />
            <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-[80px] opacity-40" style={{
              background: activeTab === 'men' ? 'rgba(59, 130, 246, 0.2)' : activeTab === 'women' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'
            }} />

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 border border-luxury-gold/20" />
            <div className="absolute bottom-10 right-10 w-16 h-16 border border-luxury-gold/10 rotate-45" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center p-8 lg:p-12">
              <div className="space-y-6 max-w-3xl">
                <div className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-full border-2 border-luxury-gold/40 bg-luxury-gold/5">
                  <span className="text-3xl text-luxury-gold">{current.icon}</span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-soft-white">
                    {current.title}
                  </h3>
                  <p className="text-lg lg:text-xl text-soft-white/70 font-light italic">
                    {current.tagline}
                  </p>
                  <p className="text-base text-soft-white/60 max-w-xl mx-auto leading-relaxed">
                    {current.description}
                  </p>
                </div>

                <button className="group/btn relative inline-flex px-10 py-4 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-sm hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all duration-500">
                  <span className="relative z-10">View Collection</span>
                  <span className="absolute inset-0 bg-gold-light scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-luxury-gold/30 to-transparent" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {current.items.map((item, idx) => (
            <div
              key={item.name}
              className="group relative overflow-hidden transition-all duration-500"
              style={{
                animation: `fade-in-up 0.6s ease-out ${idx * 0.1}s forwards`,
                opacity: 0,
              }}
            >
              {/* Product Card */}
              <div className="relative bg-dark-charcoal border border-luxury-gold/10 hover:border-luxury-gold/40 transition-all duration-500 overflow-hidden group-hover:shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-linear-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Product Image Placeholder */}
                <div className="aspect-3/4 flex items-center justify-center bg-linear-to-b from-dark-charcoal via-rich-black to-dark-charcoal relative overflow-hidden">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative text-center p-8 z-10">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center">
                      <span className="font-heading text-4xl font-bold text-luxury-gold group-hover:scale-110 transition-transform duration-500">
                        K
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-soft-white/40 group-hover:text-luxury-gold transition-colors duration-500">
                      Premium Piece
                    </p>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-luxury-gold/20 backdrop-blur-md border border-luxury-gold/30 text-xs tracking-wider uppercase text-luxury-gold rounded-full">
                    New
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6 lg:p-5 relative">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-heading text-lg font-bold text-soft-white group-hover:text-luxury-gold transition-colors duration-300">
                          {item.name}
                        </h4>
                        <p className="text-xs uppercase tracking-[0.1rem] text-soft-white/40 mt-1">
                          {item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-heading text-2xl font-bold text-luxury-gold">
                        {item.price}
                      </span>
                      <button className="p-2 rounded-full border border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold hover:text-rich-black transition-all duration-300">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Interest Line */}
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-transparent via-luxury-gold to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <p className="text-soft-white/50 text-base mb-6">
            Discover more premium streetwear and limited drops
          </p>
          <button className="group relative px-12 py-4 border-2 border-luxury-gold text-luxury-gold font-bold uppercase tracking-[0.15em] text-sm hover:bg-luxury-gold hover:text-rich-black transition-all duration-500">
            <span className="relative z-10">Explore All Collections</span>
            <span className="absolute inset-0 bg-luxury-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left -z-10" />
          </button>
        </div>
      </div>
    </section>
  );
}
