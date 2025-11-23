import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function GalleryMediaPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (vendorProfileId) {
      loadPhotos();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));

      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        showBanner('Photos uploaded successfully!', 'success');
        loadPhotos();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      showBanner('Failed to upload photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Photo deleted successfully!', 'success');
        loadPhotos();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      showBanner('Failed to delete photo', 'error');
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos/${photoId}/set-primary`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Primary photo updated!', 'success');
        loadPhotos();
      }
    } catch (error) {
      console.error('Error setting primary:', error);
      showBanner('Failed to set primary photo', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-images"></i>
          </span>
          Gallery & Media
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Upload and manage your business photos. The first photo will be your primary listing image.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Upload Section */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="photo-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                {uploading ? 'Uploading...' : 'Click to upload photos'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </label>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-images" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No photos uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  border: photo.isPrimary ? '3px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <img
                  src={photo.url}
                  alt={`Gallery ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {photo.isPrimary && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    PRIMARY
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center'
                }}>
                  {!photo.isPrimary && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleSetPrimary(photo.id)}
                      style={{ background: 'white', color: 'var(--text)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    onClick={() => handleDeletePhoto(photo.id)}
                    style={{ background: 'var(--error)', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GalleryMediaPanel;
