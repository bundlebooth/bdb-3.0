import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function GalleryMediaPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState({ url: '', caption: '', isPrimary: false });

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
      
      // Load photos
      const photosResponse = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        setPhotos(photosData.photos || []);
      }
      
      // Load albums
      const albumsResponse = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/albums`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setAlbums(albumsData.albums || []);
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

  const handleAddPhotoByUrl = async () => {
    if (!urlInput.url) {
      showBanner('Please enter a URL', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/photos/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          url: urlInput.url,
          caption: urlInput.caption,
          isPrimary: urlInput.isPrimary
        })
      });

      if (response.ok) {
        showBanner('Photo added successfully!', 'success');
        setUrlInput({ url: '', caption: '', isPrimary: false });
        loadPhotos();
      } else {
        throw new Error('Failed to add photo');
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      showBanner('Failed to add photo', 'error');
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
          Manage your business photos and organize them into themed albums
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        {/* Business Photos Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-images"></i> Business Photos
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }} id="vendor-photos">
            {photos.length === 0 ? (
              <p>No photos uploaded.</p>
            ) : (
              photos.map((photo, index) => (
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
              ))
            )}
          </div>
          <button className="btn btn-outline" id="upload-photos-btn" onClick={() => document.getElementById('photo-upload-input').click()}>
            <i className="fas fa-upload"></i> Upload Photos
          </button>
          <input
            type="file"
            id="photo-upload-input"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="image-url-input">Add Image by URL</label>
              <input
                type="url"
                id="image-url-input"
                placeholder="https://..."
                value={urlInput.url}
                onChange={(e) => setUrlInput({ ...urlInput, url: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="image-caption-input">Caption (optional)</label>
              <input
                type="text"
                id="image-caption-input"
                value={urlInput.caption}
                onChange={(e) => setUrlInput({ ...urlInput, caption: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label>
                <input
                  type="checkbox"
                  id="image-primary-checkbox"
                  checked={urlInput.isPrimary}
                  onChange={(e) => setUrlInput({ ...urlInput, isPrimary: e.target.checked })}
                />
                {' '}Primary
              </label>
              <button className="btn btn-primary" type="button" id="add-photo-url-btn" onClick={handleAddPhotoByUrl}>
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Photo Albums Section */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-folder-open"></i> Photo Albums
          </h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Organize your work into themed albums to showcase different types of events, projects, or styles. Albums help potential clients browse your portfolio easily.
          </p>
          
          {/* Albums List */}
          <div id="portfolio-albums-list" style={{ marginBottom: '2rem' }}>
            {albums.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                No albums created yet.
              </p>
            ) : (
              albums.map((album) => (
                <div key={album.id} style={{ padding: '1rem', background: '#f9fafb', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{album.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {album.photoCount || 0} photos
                      </p>
                    </div>
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-edit"></i> Manage
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Create Album Button */}
          <button className="btn btn-primary" id="create-album-btn">
            <i className="fas fa-plus"></i> Create New Album
          </button>
        </div>
      </div>
    </div>
  );
}

export default GalleryMediaPanel;
