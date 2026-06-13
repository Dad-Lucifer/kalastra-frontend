import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../../utils/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string;
  images: Array<{ url: string; alt: string; order: number }>;
}

// ─── Static mood labels (same order, same UI) ────────────────────────────────

const moodLabels = [
  { title1: 'FORMAL',  title2: 'WEAR'    },
  { title1: 'HOLIDAY', title2: 'ENERGY'  },
  { title1: 'SUMMER',  title2: 'ESCAPE'  },
  { title1: 'BASICS',  title2: 'DAILY'   },
  { title1: 'LUXURY',  title2: 'REFINED' },
];

// ─── Fallback images (used when API has no products or thumbnail is missing) ─

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620012253295-c15cb3e71247?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507114845806-0347f6150324?q=80&w=800&auto=format&fit=crop',
];

// ─── Session-cache helpers ────────────────────────────────────────────────────

/**
 * Derive a stable session key from the access token.
 * If the user logs out and back in (new token) a fresh key is generated,
 * which effectively clears the old cache entry on next access.
 */
function getSessionKey(): string {
  const token = localStorage.getItem('accessToken');
  // Use first 16 chars of token as a lightweight fingerprint; falls back to
  // a common key for unauthenticated visitors so they still get a stable set.
  const fp = token ? token.slice(0, 16) : 'guest';
  return `kalasatra_mood_products_${fp}`;
}

function loadCached(): Product[] | null {
  try {
    const raw = sessionStorage.getItem(getSessionKey());
    return raw ? (JSON.parse(raw) as Product[]) : null;
  } catch {
    return null;
  }
}

function saveCache(products: Product[]): void {
  try {
    sessionStorage.setItem(getSessionKey(), JSON.stringify(products));
  } catch {
    // sessionStorage full — skip caching silently
  }
}

/** Fisher-Yates shuffle, returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MatchTheMood() {
  const [moodItems, setMoodItems] = useState<
    Array<{ id: number; title1: string; title2: string; imgUrl: string; slug: string | null }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1️⃣  Try the session cache first
      const cached = loadCached();
      if (cached && cached.length >= 5) {
        if (!cancelled) buildItems(cached.slice(0, 5));
        return;
      }

      // 2️⃣  Fetch from backend
      const res = await apiRequest<Product[]>('/products?limit=100&is_active=true');

      if (cancelled) return;

      if (res.success && res.data && res.data.length > 0) {
        const picked = shuffle(res.data).slice(0, 5);
        saveCache(picked);
        buildItems(picked);
      } else {
        // No products yet — render with fallback images and no links
        buildItems([]);
      }
    }

    function buildItems(products: Product[]) {
      setMoodItems(
        moodLabels.map((label, i) => {
          const p = products[i];
          const imgUrl = p
            ? (p.thumbnail_url || p.images?.[0]?.url || FALLBACK_IMGS[i])
            : FALLBACK_IMGS[i];
          return {
            id:     i + 1,
            title1: label.title1,
            title2: label.title2,
            imgUrl,
            slug:   p?.slug ?? null,
          };
        })
      );
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="w-full bg-black py-20 lg:py-32 overflow-hidden border-t border-white/5">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center mb-16 text-center"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-[1px] bg-[#D4AF37]/50" />
            <span className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase">
              Vibe Check
            </span>
            <div className="w-12 h-[1px] bg-[#D4AF37]/50" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black tracking-widest uppercase text-white drop-shadow-xl">
            MATCH THE MOOD
          </h2>
        </motion.div>

        {/* Horizontal Scroll on Mobile, Grid on Desktop */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 lg:gap-6 pb-8 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(moodItems.length > 0 ? moodItems : moodLabels.map((l, i) => ({ id: i + 1, ...l, imgUrl: FALLBACK_IMGS[i], slug: null }))).map((item) => {
            const inner = (
              <>
                {/* Image with subtle zoom on hover */}
                <img
                  src={item.imgUrl}
                  alt={`${item.title1} ${item.title2}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                {/* Base Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-700" />

                {/* Gold Tint Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/40 via-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-color" />

                {/* Gold Border Frame Effect (Inside) */}
                <div className="absolute inset-4 border border-[#D4AF37]/0 group-hover:border-[#D4AF37]/50 transition-all duration-700 scale-95 group-hover:scale-100" />

                {/* Text Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                  <span className="text-[#D4AF37] text-2xl lg:text-3xl font-black tracking-widest uppercase mb-1 drop-shadow-md">
                    {item.title1}
                  </span>
                  <span className="text-white/80 group-hover:text-white text-xs lg:text-sm tracking-[0.3em] font-medium uppercase transition-colors duration-500">
                    {item.title2}
                  </span>
                </div>
              </>
            );

            const cardClass =
              'relative flex-none w-[75vw] sm:w-[45vw] lg:w-auto aspect-[3/4] group cursor-pointer overflow-hidden bg-zinc-900 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-700 snap-center';

            return (
              <motion.div key={item.id} variants={cardVariants} className={cardClass}>
                {item.slug ? (
                  <Link
                    to={`/product/${item.slug}`}
                    className="absolute inset-0 w-full h-full block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="absolute inset-0 w-full h-full">{inner}</div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
