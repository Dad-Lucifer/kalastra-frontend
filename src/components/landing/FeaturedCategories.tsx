import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import mensMobileImg from '../../assets/collection/collection-1-m.png';
import kidsMobileImg from '../../assets/collection/collection-2-m.png';
import womensMobileImg from '../../assets/collection/collection-3-m.png';
import accessoriesMobileImg from '../../assets/collection/collection-4-m.png';
import kidPcImg from '../../assets/collection/collection-2-p.png';
import mensPcImg from '../../assets/collection/collection-1-p.png';
import womensPcImg from '../../assets/collection/collection-3-p.png';

const categories = [
  {
    id: 'mens-collection',
    name: 'MENS',
    subtitle: 'SHARP & REFINED',
    imgUrl: mensPcImg,
    mobileImgUrl: mensMobileImg,
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 'womens-collection',
    name: 'WOMENS',
    subtitle: 'ELEGANCE REDEFINED',
    imgUrl: womensPcImg,
    mobileImgUrl: womensMobileImg,
    className: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 'kids-collection',
    name: 'KIDS',
    subtitle: 'PLAYFUL SPIRIT',
    imgUrl: kidPcImg,
    mobileImgUrl: kidsMobileImg,
    className: 'md:col-span-2 md:row-span-1',
  },
  {
    id: 'accessories',
    name: 'ACCESSORIES',
    subtitle: 'THE FINAL TOUCH',
    imgUrl: accessoriesMobileImg,
    mobileImgUrl: accessoriesMobileImg,
    className: 'md:col-span-1 md:row-span-1',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] as const } 
  },
};

export default function FeaturedCategories() {
  return (
    <section className="w-full bg-black py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center mb-16 text-center"
        >
          <span className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase mb-4 block">
            Curated For You
          </span>
          <h2 className="text-3xl lg:text-5xl font-black tracking-widest uppercase text-white drop-shadow-xl">
            DISCOVER THE COLLECTIONS
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 h-auto md:h-[900px]"
        >
          {categories.map((category) => {
            const isAccessories = category.id === 'accessories';
            const Container = isAccessories ? 'div' : Link;
            const containerProps = isAccessories ? {} : { to: `/products/${category.id}` };

            return (
              <motion.div 
                key={category.id} 
                variants={itemVariants}
                className={`group relative overflow-hidden bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/50 transition-colors duration-500 min-h-[300px] ${category.className} ${isAccessories ? 'cursor-not-allowed' : ''}`}
              >
                <Container {...(containerProps as any)} className="absolute inset-0 w-full h-full block">
                  {/* Product Image */}
                  <img 
                    src={category.imgUrl} 
                    alt={category.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${category.mobileImgUrl ? 'hidden md:block' : ''}`}
                  />
                  {category.mobileImgUrl && (
                    <img 
                      src={category.mobileImgUrl} 
                      alt={`${category.name} Mobile`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 md:hidden"
                    />
                  )}

                  {/* Gradients */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Content Box */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <span className="block text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {isAccessories ? 'Coming Soon.' : category.subtitle}
                    </span>
                    <div className="flex items-center justify-between">
                      <h3 className="text-white text-2xl lg:text-4xl font-black tracking-[0.1em] uppercase">
                        {category.name}
                      </h3>
                      
                      {/* Hover Arrow */}
                      {!isAccessories && (
                        <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </Container>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
