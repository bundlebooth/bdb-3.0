import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';
import { DeleteButton } from '../common/UIComponents';

function GalleryStep({ formData, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState({ url: '', caption: '', isPrimary: false });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRefs = useRef({});
  const MIN_PHOTOS = 5;

  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadPhotos();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const images = Array.isArray(data) ? data : [];
        const mappedPhotos = images.map(img => ({
          id: img.id || img.ImageID,
          url: img.url || img.ImageURL,
          caption: img.caption || img.Caption,
          isPrimary: img.isPrimary || img.IsPrimary
        }));
        setPhotos(mappedPhotos);
        setFormData(prev => ({
          ...prev,
          photoURLs: mappedPhotos.map(p => p.url)
        }));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, slotIndex = null) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your profile first before uploading photos.', 'warning');
      return;
    }

    try {
      setUploading(true);
      
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const uploadResponse = await fetch(`${API_BASE_URL}/vendors/service-image/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        const uploadData = await uploadResponse.json();
        
        const saveResponse = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            url: uploadData.imageUrl,
            isPrimary: slotIndex === 0 && photos.length === 0
          })
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save image');
        }
      }
      
      showBanner('Photo uploaded successfully!', 'success');
      loadPhotos();
    } catch (error) {
      console.error('Error uploading:', error);
      showBanner('Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Photo deleted!', 'success');
        loadPhotos();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      showBanner('Failed to delete photo', 'error');
    }
  };

  const handleAddPhotoByUrl = async () => {
    if (!urlInput.url.trim()) {
      showBanner('Please enter a URL', 'error');
      return;
    }

    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your profile first', 'warning');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          url: urlInput.url.trim(),
          caption: urlInput.caption.trim(),
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
    } finally {
      setUploading(false);
    }
  };

  // Drag handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    setPhotos(newPhotos);
    setDragOverIndex(null);
    setDraggedIndex(null);

    // Save new order
    try {
      const orderData = newPhotos.map((photo, idx) => ({
        imageId: photo.id,
        displayOrder: idx + 1
      }));
      
      await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ images: orderData })
      });
      
      setFormData(prev => ({
        ...prev,
        photoURLs: newPhotos.map(p => p.url)
      }));
    } catch (error) {
      console.error('Error saving order:', error);
      loadPhotos();
    }
  };

  const triggerFileInput = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].click();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Create slots array - show at least MIN_PHOTOS slots
  const totalSlots = Math.max(MIN_PHOTOS, photos.length + 1);
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    slots.push(photos[i] || null);
  }

  const coverPhoto = photos.find(p => p.isPrimary) || photos[0];
  const otherPhotos = photos.filter(p => p !== coverPhoto);

  return (
    <div className="gallery-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* Photo count requirement */}
        <p style={{ 
          fontSize: '0.9rem', 
          color: photos.length >= MIN_PHOTOS ? '#16a34a' : '#dc2626',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          At least {MIN_PHOTOS} photos required <span style={{ color: '#ef4444' }}>*</span>
          <span style={{ color: '#6b7280' }}>— {photos.length}/{MIN_PHOTOS} photo{photos.length !== 1 ? 's' : ''} uploaded</span>
        </p>

        {/* Airbnb-style photo grid */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Cover photo - large */}
          <div 
            onClick={() => !coverPhoto && triggerFileInput(0)}
            draggable={!!coverPhoto}
            onDragStart={(e) => coverPhoto && handleDragStart(e, 0)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 0)}
            onDrop={(e) => handleDrop(e, 0)}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '12px',
              overflow: 'hidden',
              border: dragOverIndex === 0 ? '3px solid var(--primary)' : '2px dashed #d1d5db',
              background: coverPhoto ? 'transparent' : '#f9fafb',
              cursor: coverPhoto ? 'grab' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {coverPhoto ? (
              <>
                <img 
                  src={coverPhoto.url} 
                  alt="Cover" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#222',
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  Cover Photo
                </div>
                <DeleteButton 
                  onClick={(e) => handleDeletePhoto(coverPhoto.id, e)}
                  title="Remove"
                  style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px',
                    background: 'rgba(255,255,255,0.95)'
                  }}
                />
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af'
              }}>
                <i className="fas fa-image" style={{ fontSize: '3rem', marginBottom: '0.75rem' }}></i>
                <span style={{ fontSize: '0.9rem' }}>Click to add cover photo</span>
              </div>
            )}
            <input
              ref={el => fileInputRefs.current[0] = el}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 0)}
              style={{ display: 'none' }}
            />
          </div>

          {/* Additional photos - 2x2 grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {[1, 2, 3, 4].map((slotIndex) => {
              const photo = otherPhotos[slotIndex - 1];
              const isAddMore = slotIndex === 4 && !photo && photos.length >= 4;
              
              return (
                <div
                  key={slotIndex}
                  onClick={() => !photo && triggerFileInput(slotIndex)}
                  draggable={!!photo}
                  onDragStart={(e) => photo && handleDragStart(e, photos.indexOf(photo))}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => photo && handleDragOver(e, photos.indexOf(photo))}
                  onDrop={(e) => photo && handleDrop(e, photos.indexOf(photo))}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px dashed #d1d5db',
                    background: photo ? 'transparent' : '#f9fafb',
                    cursor: photo ? 'grab' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {photo ? (
                    <>
                      <img 
                        src={photo.url} 
                        alt={`Photo ${slotIndex}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <DeleteButton 
                        onClick={(e) => handleDeletePhoto(photo.id, e)}
                        title="Remove"
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px',
                          background: 'rgba(255,255,255,0.95)'
                        }}
                      />
                    </>
                  ) : isAddMore ? (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <i className="fas fa-plus" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      <span style={{ fontSize: '0.85rem' }}>Add more</span>
                    </div>
                  ) : (
                    <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                  )}
                  <input
                    ref={el => fileInputRefs.current[slotIndex] = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, slotIndex)}
                    style={{ display: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Add by URL section */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto auto',
          gap: '0.75rem',
          alignItems: 'end',
          marginTop: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: '#374151' }}>
              Add Image by URL
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={urlInput.url}
              onChange={(e) => setUrlInput(prev => ({ ...prev, url: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: '#374151' }}>
              Caption (optional)
            </label>
            <input
              type="text"
              placeholder=""
              value={urlInput.caption}
              onChange={(e) => setUrlInput(prev => ({ ...prev, caption: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer',
            paddingBottom: '0.625rem'
          }}>
            <input
              type="checkbox"
              checked={urlInput.isPrimary}
              onChange={(e) => setUrlInput(prev => ({ ...prev, isPrimary: e.target.checked }))}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#374151' }}>Primary</span>
          </label>
          <button
            onClick={handleAddPhotoByUrl}
            disabled={uploading || !urlInput.url.trim()}
            style={{
              padding: '0.625rem 1rem',
              background: '#222',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: uploading || !urlInput.url.trim() ? 'not-allowed' : 'pointer',
              opacity: uploading || !urlInput.url.trim() ? 0.6 : 1
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default GalleryStep;
