import React, { useState, useEffect, useRef, useCallback } from 'react';

const categories = [
  { key: 'all', icon: 'fa-layer-group', label: 'All Categories' },
  { key: 'venue', icon: 'fa-building', label: 'Venues' },
  { key: 'photo', icon: 'fa-camera', label: 'Photo/Video' },
  { key: 'music', icon: 'fa-music', label: 'Music/DJ' },
  { key: 'catering', icon: 'fa-utensils', label: 'Catering' },
  { key: 'entertainment', icon: 'fa-theater-masks', label: 'Entertainment' },
  { key: 'experiences', icon: 'fa-star', label: 'Experiences' },
  { key: 'decor', icon: 'fa-ribbon', label: 'Decorations' },
  { key: 'beauty', icon: 'fa-spa', label: 'Beauty' },
  { key: 'cake', icon: 'fa-birthday-cake', label: 'Cake' },
  { key: 'transport', icon: 'fa-shuttle-van', label: 'Transportation' },
  { key: 'planner', icon: 'fa-clipboard-list', label: 'Planners' },
  { key: 'fashion', icon: 'fa-tshirt', label: 'Fashion' },
  { key: 'stationery', icon: 'fa-envelope', label: 'Stationery' }
];

function CategoriesNav({ activeCategory, onCategoryChange }) {
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const indicatorRef = useRef(null);

  const checkScrollButtons = useCallback(() => {
    if (listRef.current && wrapperRef.current) {
      const needsScroll = listRef.current.scrollWidth > wrapperRef.current.clientWidth;
      setShowScrollButtons(needsScroll);
    }
  }, []);

  const updateIndicator = useCallback(() => {
    const activeIndex = categories.findIndex(cat => cat.key === activeCategory);
    if (activeIndex >= 0 && indicatorRef.current && listRef.current) {
      const items = listRef.current.querySelectorAll('.category-item');
      if (items[activeIndex]) {
        const item = items[activeIndex];
        const left = item.offsetLeft;
        const width = item.offsetWidth;
        indicatorRef.current.style.transform = `translateX(${left + width / 2 - 30}px)`;
      }
    }
  }, [activeCategory]);

  useEffect(() => {
    checkScrollButtons();
    updateIndicator();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('resize', checkScrollButtons);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [checkScrollButtons, updateIndicator]);

  useEffect(() => {
    updateIndicator();
  }, [activeCategory, updateIndicator]);

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
    <nav className={`categories-nav ${isScrolled ? 'scrolled' : ''}`}>
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
          {categories.map((category) => (
            <div
              key={category.key}
              className={`category-item ${activeCategory === category.key ? 'active' : ''}`}
              data-category={category.key}
              onClick={() => onCategoryChange(category.key)}
            >
              <i className={`fas ${category.icon}`}></i>
              <span>{category.label}</span>
            </div>
          ))}
        </div>
        <div className="category-indicator" ref={indicatorRef} id="category-indicator"></div>
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
