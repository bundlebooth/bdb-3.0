import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BrowseByCity.css';

const BrowseByCity = () => {
  const navigate = useNavigate();

  // Canadian cities only
  const cities = [
    { name: 'Toronto', province: 'ON' },
    { name: 'Vancouver', province: 'BC' },
    { name: 'Montreal', province: 'QC' },
    { name: 'Calgary', province: 'AB' },
    { name: 'Ottawa', province: 'ON' },
    { name: 'Edmonton', province: 'AB' }
  ];

  // Categories to show under each city
  const categories = [
    { name: 'Venues', slug: 'venue' },
    { name: 'Photographers', slug: 'photo' },
    { name: 'Caterers', slug: 'catering' },
    { name: 'DJs & Music', slug: 'music' },
    { name: 'Decorators', slug: 'decor' },
    { name: 'Event Planners', slug: 'planner' }
  ];

  const handleCityClick = (cityName) => {
    window.scrollTo(0, 0);
    navigate(`/explore?location=${encodeURIComponent(cityName)}`);
  };

  const handleCategoryInCityClick = (cityName, categorySlug) => {
    window.scrollTo(0, 0);
    navigate(`/explore?location=${encodeURIComponent(cityName)}&category=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <section className="browse-by-city-section">
      <div className="browse-by-city-container">
        <h2 className="browse-by-city-title">Browse by City</h2>
        
        {/* Canada Tab - single active tab */}
        <div className="country-tabs">
          <button className="country-tab active">Canada</button>
        </div>

        {/* Cities Grid */}
        <div className="cities-grid">
          {cities.map((city) => (
            <div key={city.name} className="city-column">
              <h3 
                className="city-name"
                onClick={() => handleCityClick(city.name)}
              >
                {city.name}
              </h3>
              <ul className="city-categories">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <button
                      className="category-link"
                      onClick={() => handleCategoryInCityClick(city.name, category.slug)}
                    >
                      {category.name} in {city.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrowseByCity;
