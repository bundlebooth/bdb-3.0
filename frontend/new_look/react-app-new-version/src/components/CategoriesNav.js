import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutGrid, 
  School, 
  Camera, 
  Music, 
  Utensils, 
  PartyPopper, 
  Star, 
  Ribbon, 
  Scissors, 
  Cake, 
  Car, 
  ClipboardList, 
  ShoppingBag, 
  Mail 
} from 'lucide-react';

// Clean flat cartoon icons matching the reference style
const CartoonIcon = ({ type, size = 36 }) => {
  const icons = {
    all: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="30" fill="#FF6B35" />
        <circle cx="35" cy="40" r="6" fill="#FFF" />
        <circle cx="65" cy="40" r="6" fill="#FFF" />
        <circle cx="50" cy="60" r="6" fill="#FFF" />
        <circle cx="50" cy="40" r="4" fill="#FFF" />
      </svg>
    ),
    venue: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,25 25,70 75,70" fill="#E74C3C" />
        <rect x="45" y="55" width="10" height="15" fill="#8B4513" />
        <rect x="35" y="45" width="8" height="8" fill="#3498DB" />
        <rect x="57" y="45" width="8" height="8" fill="#3498DB" />
        <circle cx="48" cy="62" r="1.5" fill="#FFD700" />
      </svg>
    ),
    photo: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="25" y="35" width="50" height="35" rx="5" fill="#3498DB" />
        <circle cx="50" cy="52" r="12" fill="#2C3E50" />
        <circle cx="50" cy="52" r="7" fill="#95A5A6" />
        <rect x="60" y="42" width="6" height="4" rx="2" fill="#E74C3C" />
        <circle cx="35" cy="42" r="2" fill="#27AE60" />
      </svg>
    ),
    music: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="35" cy="65" r="12" fill="#9B59B6" />
        <circle cx="65" cy="55" r="10" fill="#E74C3C" />
        <rect x="60" y="30" width="4" height="35" fill="#2C3E50" />
        <rect x="30" y="40" width="4" height="35" fill="#2C3E50" />
        <path d="M34 40 Q50 25 64 30" stroke="#F39C12" strokeWidth="3" fill="none" />
      </svg>
    ),
    catering: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="65" rx="25" ry="6" fill="#F39C12" />
        <circle cx="40" cy="45" r="6" fill="#E74C3C" />
        <circle cx="55" cy="40" r="5" fill="#27AE60" />
        <circle cx="50" cy="55" r="4" fill="#9B59B6" />
        <circle cx="35" cy="55" r="3" fill="#FF6B35" />
        <circle cx="65" cy="50" r="4" fill="#3498DB" />
      </svg>
    ),
    entertainment: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M30 40 Q50 20 70 40 Q50 60 30 40" fill="#E74C3C" />
        <path d="M30 60 Q50 80 70 60 Q50 40 30 60" fill="#3498DB" />
        <circle cx="50" cy="50" r="6" fill="#FFD700" />
      </svg>
    ),
    experiences: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,25 55,40 70,40 60,50 65,65 50,58 35,65 40,50 30,40 45,40" fill="#FFD700" />
      </svg>
    ),
    decor: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="35" rx="15" ry="10" fill="#E91E63" />
        <rect x="47" y="35" width="6" height="25" fill="#4CAF50" />
        <circle cx="40" cy="60" r="5" fill="#FF9800" />
        <circle cx="60" cy="60" r="5" fill="#9C27B0" />
        <circle cx="50" cy="65" r="4" fill="#2196F3" />
      </svg>
    ),
    beauty: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="45" y="30" width="10" height="40" rx="5" fill="#E91E63" />
        <circle cx="50" cy="35" r="6" fill="#FF6B9D" />
        <rect x="47" y="65" width="6" height="6" rx="1" fill="#8E24AA" />
      </svg>
    ),
    cake: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="35" y="50" width="30" height="20" fill="#8D6E63" />
        <rect x="35" y="45" width="30" height="10" fill="#FFE082" />
        <rect x="48" y="35" width="4" height="15" fill="#FF5722" />
        <ellipse cx="50" cy="32" rx="2" ry="4" fill="#FF9800" />
      </svg>
    ),
    transport: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="30" y="45" width="40" height="15" rx="5" fill="#2196F3" />
        <circle cx="40" cy="65" r="5" fill="#2C3E50" />
        <circle cx="60" cy="65" r="5" fill="#2C3E50" />
        <rect x="35" y="50" width="8" height="6" fill="#81D4FA" />
        <rect x="46" y="50" width="8" height="6" fill="#81D4FA" />
        <rect x="57" y="50" width="8" height="6" fill="#81D4FA" />
      </svg>
    ),
    planner: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="40" y="30" width="20" height="30" rx="2" fill="#FFF" stroke="#34495E" strokeWidth="2" />
        <rect x="40" y="25" width="20" height="6" fill="#FF9800" />
        <rect x="43" y="38" width="14" height="1.5" fill="#666" />
        <rect x="43" y="44" width="10" height="1.5" fill="#666" />
        <rect x="43" y="50" width="12" height="1.5" fill="#666" />
        <circle cx="45" cy="39" r="1" fill="#4CAF50" />
      </svg>
    ),
    fashion: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M45 30 Q50 25 55 30 L58 45 Q50 42 42 45 Z" fill="#E91E63" />
        <rect x="42" y="45" width="16" height="25" fill="#9C27B0" />
      </svg>
    ),
    stationery: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="35" y="40" width="30" height="20" rx="2" fill="#FFF" stroke="#34495E" strokeWidth="2" />
        <polygon points="35,40 50,48 65,40" fill="#3498DB" />
        <rect x="47" y="52" width="6" height="1" fill="#666" />
        <rect x="45" y="56" width="10" height="1" fill="#666" />
      </svg>
    )
  };
  
  return icons[type] || icons.all;
};

const categories = [
  { 
    key: 'all', 
    icon: <LayoutGrid size={24} color="#6366f1" strokeWidth={2} />, 
    label: 'All Categories', 
    bgColor: '#e8eaff' 
  },
  { 
    key: 'venue', 
    icon: <School size={24} color="#a855f7" strokeWidth={2} />, 
    label: 'Venues', 
    bgColor: '#f3e8ff' 
  },
  { 
    key: 'photo', 
    icon: <Camera size={24} color="#06b6d4" strokeWidth={2} />, 
    label: 'Photo/Video', 
    bgColor: '#cffafe' 
  },
  { 
    key: 'music', 
    icon: <Music size={24} color="#10b981" strokeWidth={2} />, 
    label: 'Music/DJ', 
    bgColor: '#d1fae5' 
  },
  { 
    key: 'catering', 
    icon: <Utensils size={24} color="#f59e0b" strokeWidth={2} />, 
    label: 'Catering', 
    bgColor: '#fef3c7' 
  },
  { 
    key: 'entertainment', 
    icon: <PartyPopper size={24} color="#ef4444" strokeWidth={2} />, 
    label: 'Entertainment', 
    bgColor: '#fecaca' 
  },
  { 
    key: 'experiences', 
    icon: <Star size={24} color="#f97316" strokeWidth={2} />, 
    label: 'Experiences', 
    bgColor: '#fed7aa' 
  },
  { 
    key: 'decor', 
    icon: <Ribbon size={24} color="#ec4899" strokeWidth={2} />, 
    label: 'Decorations', 
    bgColor: '#fce7f3' 
  },
  { 
    key: 'beauty', 
    icon: <Scissors size={24} color="#be185d" strokeWidth={2} />, 
    label: 'Beauty', 
    bgColor: '#fdf2f8' 
  },
  { 
    key: 'cake', 
    icon: <Cake size={24} color="#a855f7" strokeWidth={2} />, 
    label: 'Cake', 
    bgColor: '#f3e8ff' 
  },
  { 
    key: 'transport', 
    icon: <Car size={24} color="#3b82f6" strokeWidth={2} />, 
    label: 'Transportation', 
    bgColor: '#dbeafe' 
  },
  { 
    key: 'planner', 
    icon: <ClipboardList size={24} color="#64748b" strokeWidth={2} />, 
    label: 'Planners', 
    bgColor: '#e2e8f0' 
  },
  { 
    key: 'fashion', 
    icon: <ShoppingBag size={24} color="#7c3aed" strokeWidth={2} />, 
    label: 'Fashion', 
    bgColor: '#ede9fe' 
  },
  { 
    key: 'stationery', 
    icon: <Mail size={24} color="#8b5cf6" strokeWidth={2} />, 
    label: 'Stationery', 
    bgColor: '#e9d5ff' 
  }
];

function CategoriesNav({ activeCategory, onCategoryChange, loading = false }) {
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const indicatorRef = useRef(null);

  const checkScrollButtons = useCallback(() => {
    if (listRef.current && wrapperRef.current) {
      const needsScroll = listRef.current.scrollWidth > wrapperRef.current.clientWidth;
      setShowScrollButtons(needsScroll);
    }
  }, []);

  const updateIndicator = useCallback((skipTransition = false) => {
    if (loading) return; // Don't update during loading
    
    const activeIndex = categories.findIndex(cat => cat.key === activeCategory);
    if (activeIndex >= 0 && indicatorRef.current && listRef.current && wrapperRef.current) {
      const items = listRef.current.querySelectorAll('.category-item:not(.skeleton)');
      if (items[activeIndex]) {
        const item = items[activeIndex];
        
        // Calculate position relative to the categories list (stays fixed under selected category)
        const left = item.offsetLeft;
        const width = item.offsetWidth;
        
        // Skip transition on initial load to prevent animation from left edge
        if (skipTransition) {
          indicatorRef.current.style.transition = 'none';
        }
        
        indicatorRef.current.style.width = `${width}px`;
        indicatorRef.current.style.transform = `translateX(${left}px)`;
        
        // Re-enable transition after initial positioning
        if (skipTransition) {
          requestAnimationFrame(() => {
            if (indicatorRef.current) {
              indicatorRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
          });
        }
      }
    }
  }, [activeCategory, loading]);


  // Initial setup - skip transition on first render
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    checkScrollButtons();
    // Skip transition on initial mount
    updateIndicator(true);
    
    window.addEventListener('resize', checkScrollButtons);
    window.addEventListener('resize', () => updateIndicator(false));
    
    // No scroll listener - indicator stays fixed under selected category
    
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
      window.removeEventListener('resize', () => updateIndicator(false));
    };
  }, [checkScrollButtons, updateIndicator]);

  useEffect(() => {
    // Skip transition only on initial mount, animate on subsequent changes
    const timer = setTimeout(() => {
      if (isInitialMount.current) {
        updateIndicator(true); // No animation on first load
        isInitialMount.current = false;
      } else {
        updateIndicator(false); // Animate on category change
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeCategory, loading, updateIndicator]);

  const scroll = (direction) => {
    if (wrapperRef.current) {
      const scrollAmount = 200;
      wrapperRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="categories-nav">
      <button
        className="nav-scroll-btn left"
        id="scroll-left"
        onClick={() => scroll('left')}
        style={{ display: showScrollButtons ? 'flex' : 'none' }}
      >
        ◀
      </button>
      <div className="categories-list-wrapper" ref={wrapperRef}>
        <div className="categories-list" ref={listRef}>
          {loading ? (
            // Skeleton loading state
            Array.from({ length: 14 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="category-item"
                style={{ pointerEvents: 'none' }}
              >
                <div 
                  className="icon-wrapper"
                  style={{
                    position: 'relative',
                    width: '50px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <div
                    className="skeleton"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  ></div>
                </div>
                <div 
                  className="skeleton"
                  style={{
                    width: '60px',
                    height: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#e5e7eb',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                ></div>
              </div>
            ))
          ) : (
            categories.map((category) => (
              <div
                key={category.key}
                className={`category-item ${activeCategory === category.key ? 'active' : ''}`}
                data-category={category.key}
                onClick={() => onCategoryChange(category.key)}
                title={category.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem 0.5rem 0.75rem 0.5rem',
                  minWidth: '60px',
                  flex: '0 0 auto'
                }}
              >
                <div 
                  className="icon-wrapper"
                  style={{
                    position: 'relative',
                    width: '50px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: category.bgColor,
                      opacity: 0.4,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1
                    }}
                  ></div>
                  <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {category.icon}
                  </div>
                </div>
                <span style={{
                  lineHeight: '1.2',
                  textAlign: 'center',
                  width: '100%',
                  fontWeight: 'normal',
                  fontSize: '0.85rem'
                }}>{category.label}</span>
              </div>
            ))
          )}
          {!loading && <div className="category-indicator" ref={indicatorRef} id="category-indicator"></div>}
        </div>
      </div>
      <button
        className="nav-scroll-btn right"
        id="scroll-right"
        onClick={() => scroll('right')}
        style={{ display: showScrollButtons ? 'flex' : 'none' }}
      >
        ▶
      </button>
    </nav>
  );
}

export default CategoriesNav;
