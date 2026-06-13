import { Link } from 'react-router-dom';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full sm:w-[400px] bg-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Desktop style (Close button + Title) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <span className="font-bold text-sm tracking-widest uppercase">CATEGORIES</span>
          <div className="w-8"></div> {/* Spacer to center the title */}
        </div>

        {/* Mobile Search Bar (Visible mostly on mobile inside sidebar as per some designs, but let's make it consistent or optional) */}
        <div className="p-4 sm:hidden border-b border-gray-100">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search &quot;LINEN SHIRTS&quot;"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
          
          {/* Thumbnails Section */}
          <div className="grid grid-cols-4 gap-2 p-4">
            <Link to="/collection/1" className="block relative aspect-square bg-gray-100 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop" alt="Collection 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <Link to="/collection/2" className="block relative aspect-square bg-gray-100 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&h=200&fit=crop" alt="Collection 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <Link to="/collection/3" className="block relative aspect-square bg-gray-100 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=200&h=200&fit=crop" alt="Collection 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <Link to="/collection/4" className="block relative aspect-square bg-gray-100 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=200&h=200&fit=crop" alt="Collection 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>

          {/* Categories List */}
          <ul className="flex flex-col text-sm uppercase tracking-wider font-medium text-black">
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/#new-popular';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                NEW ARRIVALS
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/#new-popular';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                VIEW ALL
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/#new-popular';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                BESTSELLERS
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/products/mens-collection';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                Mens
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/products/womens-collection';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                Women
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/products/kids-collection';
                }} 
                className="w-full text-left block px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                Kids
              </button>
            </li>
          </ul>

        </div>
      </div>
    </>
  );
}
