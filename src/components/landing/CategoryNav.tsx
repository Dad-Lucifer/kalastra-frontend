import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { label: 'Mens', slug: 'mens-collection' },
  { label: 'Womens', slug: 'womens-collection' },
  { label: 'Kids', slug: 'kids-collection' },
];

export default function CategoryNav() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Discover');

  return (
    <div className="w-full bg-pure-white border-b border-cold-grey-light overflow-x-auto hide-scrollbar">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <ul className="flex items-center gap-8 lg:gap-10 min-w-max h-14">
          {categories.map((cat) => (
            <li key={cat.label} className="h-full flex items-center relative group">
              <button
                onClick={() => {
                  setActiveCategory(cat.label);
                  navigate(`/products/${cat.slug}`);
                }}
                className={`text-sm lg:text-[15px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  activeCategory === cat.label 
                    ? 'text-deep-black' 
                    : 'text-cold-grey group-hover:text-deep-black'
                }`}
              >
                {cat.label}
              </button>
              {activeCategory === cat.label && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-yellow"></div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
