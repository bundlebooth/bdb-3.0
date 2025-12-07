import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function GalleryMediaPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState({ url: '', caption: '', isPrimary: false });
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', coverImageURL: '', isPublic: true });

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
      console.log('Loading photos for vendorProfileId:', vendorProfileId);
      
      // Load images
      const photosResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/images`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        console.log('Photos data:', photosData);
        // Response is an array of images
        const images = Array.isArray(photosData) ? photosData : [];
        console.log('Loaded images:', images.length);
        setPhotos(images.map(img => ({
          id: img.id || img.ImageID,
          url: img.url || img.ImageURL,
          caption: img.caption || img.Caption,
          isPrimary: img.isPrimary || img.IsPrimary
        })));
      } else {
        console.error('Failed to load images:', photosResponse.status);
      }
      
      // Load albums
      const albumsResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/portfolio/albums`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        const albums = albumsData.albums || [];
        console.log('Loaded albums:', albums.length);
        setAlbums(albums.map(album => ({
          id: album.AlbumID,
          name: album.AlbumName,
          description: album.AlbumDescription,
          coverImageURL: album.CoverImageURL,
          photoCount: album.ImageCount || 0
        })));
      } else {
        console.error('Failed to load albums:', albumsResponse.status);
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
      files.forEach(file => formData.append('images', file));

      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/images`, {
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
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/images/${photoId}`, {
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
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/images/${photoId}/set-primary`, {
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

  const handleCreateAlbum = () => {
    setEditingAlbum(null);
    setAlbumForm({ name: '', description: '', coverImageURL: '', isPublic: true });
    setShowAlbumModal(true);
  };

  const handleEditAlbum = (album) => {
    setEditingAlbum(album);
    setAlbumForm({
      name: album.name,
      description: album.description || '',
      coverImageURL: album.coverImageURL || '',
      isPublic: true
    });
    setShowAlbumModal(true);
  };

  const handleSaveAlbum = async () => {
    if (!albumForm.name.trim()) {
      showBanner('Please enter an album name', 'error');
      return;
    }

    try {
      const albumData = {
        albumId: editingAlbum ? editingAlbum.id : null,
        albumName: albumForm.name.trim(),
        albumDescription: albumForm.description.trim(),
        coverImageURL: albumForm.coverImageURL.trim() || null,
        isPublic: albumForm.isPublic
      };

      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/portfolio/albums/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(albumData)
      });

      if (response.ok) {
        showBanner(`Album ${editingAlbum ? 'updated' : 'created'} successfully!`, 'success');
        setShowAlbumModal(false);
        loadPhotos();
      } else {
        throw new Error('Failed to save album');
      }
    } catch (error) {
      console.error('Error saving album:', error);
      showBanner('Failed to save album', 'error');
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Are you sure you want to delete this album? All images in this album will also be deleted. This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/portfolio/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Album deleted successfully!', 'success');
        loadPhotos();
      } else {
        throw new Error('Failed to delete album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      showBanner('Failed to delete album', 'error');
    }
  };

  const handleAddPhotoByUrl = async () => {
    if (!urlInput.url) {
      showBanner('Please enter a URL', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/images/url`, {
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
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--secondary)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
                <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '1.1rem' }}>No albums yet</p>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Create your first portfolio album to showcase your work</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {albums.map((album) => (
                  <div key={album.id} className="portfolio-album-card" style={{ background: 'var(--secondary)', borderRadius: 'var(--radius)', border: '2px solid var(--border)', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    {/* Album Cover */}
                    <div style={{ position: 'relative', paddingTop: '66%', background: 'var(--bg-dark)' }}>
                      {album.coverImageURL ? (
                        <img src={album.coverImageURL} alt={album.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: 'var(--text-light)', opacity: 0.5 }}></i>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.7)', padding: '0.25rem 0.75rem', borderRadius: '1rem', color: 'white', fontSize: '0.85rem' }}>
                        <i className="fas fa-images"></i> {album.photoCount || 0}
                      </div>
                    </div>
                    
                    {/* Album Info */}
                    <div style={{ padding: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text)', fontSize: '1.1rem' }}>{album.name}</h4>
                      {album.description && (
                        <p style={{ margin: '0 0 1rem', color: 'var(--text-light)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {album.description}
                        </p>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.9rem' }}>
                          <i className="fas fa-eye" style={{ marginRight: '0.5rem' }}></i>View
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.5rem 0.75rem' }} 
                          title="Edit album"
                          onClick={() => handleEditAlbum(album)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.5rem 0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                          title="Delete album"
                          onClick={() => handleDeleteAlbum(album.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Create Album Button */}
          <button className="btn btn-primary" id="create-album-btn" onClick={() => handleCreateAlbum()}>
            <i className="fas fa-plus"></i> Create New Album
          </button>
        </div>

        {/* Album Edit/Create Modal */}
        {showAlbumModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={() => setShowAlbumModal(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    <i className={`fas fa-folder-${editingAlbum ? 'edit' : 'plus'}`} style={{ marginRight: '0.5rem' }}></i>
                    {editingAlbum ? 'Edit' : 'Create'} Album
                  </h3>
                  <button
                    onClick={() => setShowAlbumModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Album Name *</label>
                  <input
                    type="text"
                    value={albumForm.name}
                    onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                    placeholder="e.g., Weddings 2024"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
                  <textarea
                    value={albumForm.description}
                    onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                    placeholder="Brief description of this album"
                    rows="3"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Cover Image URL</label>
                  <input
                    type="url"
                    value={albumForm.coverImageURL}
                    onChange={(e) => setAlbumForm({ ...albumForm, coverImageURL: e.target.value })}
                    placeholder="Paste image URL..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  {albumForm.coverImageURL && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={albumForm.coverImageURL} 
                        alt="Cover preview" 
                        style={{ maxWidth: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="album-public"
                    checked={albumForm.isPublic}
                    onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.checked })}
                  />
                  <label htmlFor="album-public" style={{ margin: 0 }}>Make album public (visible to clients)</label>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleSaveAlbum}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                  {editingAlbum ? 'Update' : 'Create'} Album
                </button>
                <button
                  onClick={() => setShowAlbumModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary">
            Save
          </button>
        </div>

      </div>
    </div>
  );
}

export default GalleryMediaPanel;
