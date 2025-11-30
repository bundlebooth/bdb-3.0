import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import VendorCard from '../../VendorCard';

function ClientFavoritesSection() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/favorites/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!resp.ok) throw new Error('Failed to fetch favorites');
      const favs = await resp.json();
      setFavorites(Array.isArray(favs) ? favs : []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);


  const handleToggleFavorite = useCallback(async (vendorId) => {
    // Remove from favorites
    try {
      await fetch(`${API_BASE_URL}/favorites/${currentUser.id}/${vendorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      // Reload favorites
      loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, [currentUser, loadFavorites]);

  const renderVendorCard = (vendor) => {
    const imageUrl = vendor.PortfolioImage || vendor.FeaturedImageURL || vendor.ImageURL || vendor.imageUrl || vendor.image || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
    const businessName = vendor.VendorName || vendor.BusinessName || vendor.name || 'Vendor';
    const isFavorite = true;
    
    // Price handling
    const rawPrice = vendor.startingPrice ?? vendor.MinPriceNumeric ?? vendor.MinPrice ?? vendor.price ?? vendor.Price ?? vendor.minPrice ?? vendor.starting_price ?? vendor.price;
    let priceDisplay = '';
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      if (typeof rawPrice === 'number') priceDisplay = `$${Math.round(rawPrice)}`;
      else if (typeof rawPrice === 'string') {
        const trimmed = rawPrice.trim();
        priceDisplay = trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
      }
    }
    
    // Description
    const descText = (vendor.Bio || vendor.bio || vendor.BusinessDescription || vendor.businessDescription || vendor.Description || vendor.description || vendor.About || vendor.about || '').toString();
    const shortDesc = descText.length > 140 ? `${descText.slice(0, 140)}…` : descText;
    
    // Rating
    const ratingRaw = vendor.averageRating ?? vendor.rating ?? 0;
    const ratingValue = (() => { const r = parseFloat(ratingRaw); return isNaN(r) || r === 0 ? 0 : r; })();
    const reviewCount = (() => {
      if (vendor.totalReviews != null) return vendor.totalReviews;
      if (vendor.reviewCount != null) return vendor.reviewCount;
      if (typeof ratingRaw === 'string') { const m = ratingRaw.match(/\((\d+)\)/); if (m) return parseInt(m[1]); }
      return 0;
    })();
    
    // Location
    const locCity = vendor.City || vendor.city || '';
    const locState = vendor.State || vendor.state || '';
    const locationText = (vendor.location && vendor.location.trim()) || [locCity, locState].filter(Boolean).join(', ');
    
    const vendorId = vendor.VendorProfileID || vendor.id;
    
    // Badges
    const badges = [];
    if (vendor.isPremium) badges.push({ label: 'Premium', class: 'premium' });
    if (vendor.isEcoFriendly) badges.push({ label: 'Eco-Friendly', class: 'eco' });
    if (vendor.isAwardWinning) badges.push({ label: 'Award Winner', class: 'award' });

    return (
      <div key={vendorId} className="vendor-card">
        <div className="vendor-image">
          <img 
            src={imageUrl} 
            alt={businessName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://placehold.co/800x600/e2e8f0/718096?text=No+Image'; }}
          />
          <div className={`vendor-favorite ${isFavorite ? 'active' : ''}`} data-id={vendorId}>
            <i className="fas fa-heart"></i>
          </div>
          <div className="vendor-badges" style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', gap: '6px' }}>
            {badges.map((badge, idx) => (
              <span key={idx} className={`vendor-badge ${badge.class}`}>{badge.label}</span>
            ))}
          </div>
        </div>
        <div className="vendor-details">
          <h3 className="vendor-name" style={{ fontSize: '1.1rem' }}>{businessName}</h3>
          <div className="vendor-location" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <span>
              <i className="fas fa-map-marker-alt" style={{ marginRight: '0.5rem' }}></i>
              {locationText || 'Location unavailable'}
            </span>
            {ratingValue > 0 && (
              <>
                <span style={{ color: '#6b7280' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ color: '#f59e0b', fontSize: '.9rem' }}>
                    {'★'.repeat(Math.floor(ratingValue))}{'☆'.repeat(5 - Math.floor(ratingValue))}
                  </span>
                  <span style={{ fontSize: '.85rem', color: '#6b7280' }}>
                    {ratingValue.toFixed(1)} ({reviewCount})
                  </span>
                </span>
              </>
            )}
          </div>
          {shortDesc && (
            <div className="vendor-description" style={{ margin: '.5rem 0 0.25rem', color: 'var(--text-light)', fontSize: '.95rem', lineHeight: 1.4 }}>
              {shortDesc}
            </div>
          )}
          <div className="vendor-footer">
            <div className="vendor-price" style={{ fontWeight: 600 }}>
              {priceDisplay && (
                <>
                  <span>Starting from</span> {priceDisplay}
                </>
              )}
            </div>
            <div className="vendor-actions">
              <button className="btn btn-outline save-btn" data-id={vendorId} onClick={() => handleToggleFavorite(vendorId)}>Save</button>
              <button className="btn btn-primary view-btn" data-id={vendorId}>View</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div id="favorites-section">
        <div className="dashboard-card">
          <div className="vendor-grid" id="saved-favorites">
            <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div id="favorites-section">
        <div className="dashboard-card">
          <div className="vendor-grid" id="saved-favorites">
            <p>No saved favorites.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="favorites-section">
      <div className="dashboard-card">
        <div className="vendor-grid" id="saved-favorites">
          {favorites.map((vendor) => (
            <VendorCard
              key={vendor.VendorProfileID || vendor.id}
              vendor={vendor}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
              onView={() => {}}
              onHighlight={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientFavoritesSection;
