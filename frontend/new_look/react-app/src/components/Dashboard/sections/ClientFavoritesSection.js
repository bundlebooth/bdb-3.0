import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ClientFavoritesSection() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/favorites/${currentUser.id}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.vendors || []);
      } else {
        console.error('Failed to load favorites');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      showBanner('Failed to load favorites', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = async (vendorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          vendorProfileId: vendorId 
        })
      });
      
      if (response.ok) {
        setFavorites(prev => prev.filter(v => v.VendorProfileId !== vendorId));
        showBanner('Removed from favorites', 'success');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      showBanner('Failed to remove favorite', 'error');
    }
  };

  const handleViewVendor = (vendorId) => {
    navigate(`/vendor/${vendorId}`);
  };

  const renderVendorCard = (vendor) => {
    const rating = vendor.AverageRating || 0;
    const reviewCount = vendor.ReviewCount || 0;
    const priceLevel = vendor.PriceLevel || '$$';

    return (
      <div key={vendor.VendorProfileId} className="vendor-card">
        <div className="vendor-card-image">
          <img 
            src={vendor.PrimaryImageUrl || '/placeholder-vendor.jpg'} 
            alt={vendor.BusinessName}
            onError={(e) => { e.target.src = '/placeholder-vendor.jpg'; }}
          />
          <button 
            className="favorite-btn active"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFavorite(vendor.VendorProfileId);
            }}
          >
            <i className="fas fa-heart"></i>
          </button>
        </div>
        <div className="vendor-card-content">
          <h3 className="vendor-card-title">{vendor.BusinessName}</h3>
          <div className="vendor-card-category">{vendor.Category || 'Vendor'}</div>
          <div className="vendor-card-rating">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <i 
                  key={star}
                  className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
                ></i>
              ))}
            </div>
            <span className="rating-text">
              {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <div className="vendor-card-price">{priceLevel}</div>
          <div className="vendor-card-location">
            <i className="fas fa-map-marker-alt"></i>
            {vendor.City}, {vendor.State}
          </div>
        </div>
        <div className="vendor-card-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleViewVendor(vendor.VendorProfileId)}
          >
            View Profile
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="favorites-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">My Favorites</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : favorites.length > 0 ? (
          <div className="vendor-grid" id="saved-favorites">
            {favorites.map(renderVendorCard)}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-heart" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No favorites saved yet.</p>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              Browse vendors and click the heart icon to save your favorites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientFavoritesSection;
