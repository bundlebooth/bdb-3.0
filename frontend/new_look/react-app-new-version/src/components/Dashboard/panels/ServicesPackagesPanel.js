import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import ServiceCard from '../../ServiceCard';
import SkeletonLoader from '../../SkeletonLoader';
import { showBanner } from '../../../utils/helpers';

function ServicesPackagesPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'services'
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Package state
  const [packages, setPackages] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    includedServices: [],
    price: '',
    salePrice: '',
    priceType: 'fixed', // 'fixed' or 'per_person'
    imageURL: '',
    finePrint: '',
    isActive: true
  });
  const [packageServiceSearch, setPackageServiceSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Clear state when vendorProfileId changes
  useEffect(() => {
    setServices([]);
    setPackages([]);
    setAvailableServices([]);
    setSelectedCount(0);
    setShowServicePicker(false);
    setSearchQuery('');
    setEditingService(null);
    setEditForm({});
    setShowPackageModal(false);
    setEditingPackage(null);
  }, [vendorProfileId]);

  useEffect(() => {
    if (vendorProfileId) {
      loadServices();
      loadPackages();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  // Load packages
  const loadPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/packages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  // Package management functions
  const handleCreatePackage = () => {
    // Check if there are services to include in package
    if (services.length === 0) {
      showBanner('Please create individual services first before creating a package', 'warning');
      setActiveTab('services');
      return;
    }
    setEditingPackage(null);
    setPackageForm({
      name: '',
      description: '',
      includedServices: [],
      price: '',
      salePrice: '',
      priceType: 'fixed',
      imageURL: '',
      finePrint: '',
      isActive: true
    });
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.PackageName || pkg.name || '',
      description: pkg.Description || pkg.description || '',
      includedServices: pkg.IncludedServices || pkg.includedServices || [],
      price: pkg.Price || pkg.price || '',
      salePrice: pkg.SalePrice || pkg.salePrice || '',
      priceType: pkg.PriceType || pkg.priceType || 'fixed',
      imageURL: pkg.ImageURL || pkg.imageURL || '',
      finePrint: pkg.FinePrint || pkg.finePrint || '',
      isActive: pkg.IsActive !== false
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim()) {
      showBanner('Package name is required', 'error');
      return;
    }
    if (!packageForm.price) {
      showBanner('Package price is required', 'error');
      return;
    }

    try {
      const payload = {
        packageId: editingPackage?.PackageID || editingPackage?.id || null,
        name: packageForm.name.trim(),
        description: packageForm.description,
        includedServices: packageForm.includedServices,
        price: parseFloat(packageForm.price),
        salePrice: packageForm.salePrice ? parseFloat(packageForm.salePrice) : null,
        priceType: packageForm.priceType,
        imageURL: packageForm.imageURL,
        finePrint: packageForm.finePrint,
        isActive: packageForm.isActive
      };

      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showBanner(editingPackage ? 'Package updated successfully!' : 'Package created successfully!', 'success');
        setShowPackageModal(false);
        setEditingPackage(null);
        loadPackages();
      } else {
        const data = await response.json();
        showBanner(data.message || 'Failed to save package', 'error');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      showBanner('Failed to save package', 'error');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/packages/${packageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Package deleted successfully!', 'success');
        loadPackages();
      } else {
        showBanner('Failed to delete package', 'error');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showBanner('Failed to delete package', 'error');
    }
  };

  const handlePackageImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/vendors/service-image/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPackageForm({ ...packageForm, imageURL: data.imageUrl });
        showBanner('Image uploaded successfully!', 'success');
      } else {
        showBanner('Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showBanner('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleServiceInPackage = (service) => {
    const serviceId = service.id || service.PredefinedServiceID;
    const isIncluded = packageForm.includedServices.some(s => (s.id || s.PredefinedServiceID) === serviceId);
    
    if (isIncluded) {
      setPackageForm({
        ...packageForm,
        includedServices: packageForm.includedServices.filter(s => (s.id || s.PredefinedServiceID) !== serviceId)
      });
    } else {
      setPackageForm({
        ...packageForm,
        includedServices: [...packageForm.includedServices, { id: serviceId, name: service.name || service.ServiceName }]
      });
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // First, fetch vendor's selected categories
      let vendorCategories = [];
      try {
        const categoriesResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/categories`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (categoriesResponse.ok) {
          const catData = await categoriesResponse.json();
          vendorCategories = (catData.categories || []).map(c => c.CategoryName || c.name || c);
        }
      } catch (e) {
        console.error('Error loading vendor categories:', e);
      }
      
      // Fetch available predefined services (all categories)
      const servicesResponse = await fetch(`${API_BASE_URL}/vendors/predefined-services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const servicesByCategory = servicesData.servicesByCategory || {};
        
        // Flatten services - filter by vendor's categories if they have any selected
        const allServices = [];
        Object.keys(servicesByCategory).forEach(category => {
          // If vendor has categories, only include services from those categories
          if (vendorCategories.length === 0 || vendorCategories.some(vc => 
            vc.toLowerCase() === category.toLowerCase() ||
            category.toLowerCase().includes(vc.toLowerCase()) ||
            vc.toLowerCase().includes(category.toLowerCase())
          )) {
            (servicesByCategory[category] || []).forEach(service => {
              allServices.push({ ...service, category });
            });
          }
        });
        
        setAvailableServices(allServices);
        
        // Fetch vendor's selected services
        const vendorServicesResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/selected-services`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (vendorServicesResponse.ok) {
          const vendorData = await vendorServicesResponse.json();
          const selectedServices = vendorData.selectedServices || [];
          
          // Map selected services to full service objects with saved pricing data
          const mappedServices = selectedServices.map(s => {
            const match = allServices.find(a => String(a.id) === String(s.PredefinedServiceID));
            if (match) {
              // Normalize pricing model from backend (fixed_based -> fixed_price or per_attendee)
              let normalizedPricingModel = s.PricingModel || 'time_based';
              if (s.PricingModel === 'fixed_based') {
                if (s.FixedPricingType === 'per_attendee') {
                  normalizedPricingModel = 'per_attendee';
                } else {
                  normalizedPricingModel = 'fixed_price';
                }
              }
              
              return {
                ...match,
                vendorPrice: s.VendorPrice,
                vendorDuration: s.VendorDurationMinutes || s.BaseDurationMinutes,
                vendorDescription: s.VendorDescription,
                imageURL: s.ImageURL,
                // Pull saved pricing data from database
                pricingModel: normalizedPricingModel,
                baseRate: s.BaseRate !== null && s.BaseRate !== undefined ? s.BaseRate : null,
                overtimeRatePerHour: s.OvertimeRatePerHour !== null && s.OvertimeRatePerHour !== undefined ? s.OvertimeRatePerHour : null,
                fixedPrice: s.FixedPrice !== null && s.FixedPrice !== undefined ? s.FixedPrice : null,
                pricePerPerson: s.PricePerPerson !== null && s.PricePerPerson !== undefined ? s.PricePerPerson : null,
                minimumAttendees: s.MinimumAttendees !== null && s.MinimumAttendees !== undefined ? s.MinimumAttendees : null,
                maximumAttendees: s.MaximumAttendees !== null && s.MaximumAttendees !== undefined ? s.MaximumAttendees : null,
                minimumBookingFee: s.MinimumBookingFee !== null && s.MinimumBookingFee !== undefined ? s.MinimumBookingFee : null
              };
            }
            return null;
          }).filter(Boolean);
          
          setServices(mappedServices);
          setSelectedCount(mappedServices.length);
        }
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (service) => {
    const newService = {
      ...service,
      vendorDuration: service.defaultDuration || 60,
      vendorPrice: 0,
      vendorDescription: '',
      pricingModel: 'time_based',
      baseRate: null,
      overtimeRatePerHour: null,
      fixedPrice: null,
      pricePerPerson: null,
      minimumAttendees: null,
      maximumAttendees: null
    };
    setServices([...services, newService]);
    setSelectedCount(selectedCount + 1);
    setShowServicePicker(false);
    setSearchQuery('');
  };

  const handleEditService = (service) => {
    setEditingService(service);
    // Pre-fill form with saved data from database
    setEditForm({
      pricingModel: service.pricingModel || 'time_based',
      vendorDuration: service.vendorDuration || service.defaultDuration || 60,
      baseRate: service.baseRate !== null && service.baseRate !== undefined ? service.baseRate : '',
      overtimeRatePerHour: service.overtimeRatePerHour !== null && service.overtimeRatePerHour !== undefined ? service.overtimeRatePerHour : '',
      fixedPrice: service.fixedPrice !== null && service.fixedPrice !== undefined ? service.fixedPrice : '',
      pricePerPerson: service.pricePerPerson !== null && service.pricePerPerson !== undefined ? service.pricePerPerson : '',
      minimumAttendees: service.minimumAttendees || '',
      maximumAttendees: service.maximumAttendees || '',
      minimumBookingFee: service.minimumBookingFee || '',
      vendorDescription: service.vendorDescription || ''
    });
  };

  const handleSaveEdit = () => {
    setServices(services.map(s => 
      s.id === editingService.id 
        ? { ...s, ...editForm }
        : s
    ));
    setEditingService(null);
    setEditForm({});
  };

  const handleRemoveService = (serviceId) => {
    setServices(services.filter(s => s.id !== serviceId));
    setSelectedCount(selectedCount - 1);
  };

  const handleSaveServices = async () => {
    try {
      // Derive service categories from current selection
      const serviceCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)))
        .map((name, i) => ({ name, description: null, displayOrder: i }));
      
      const payload = {
        vendorProfileId: vendorProfileId,
        serviceCategories,
        selectedPredefinedServices: services.map(s => ({
          predefinedServiceId: s.id,
          name: s.name,
          description: s.vendorDescription || s.description || '',
          durationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          imageURL: s.imageURL || null,
          pricingModel: s.pricingModel || 'time_based',
          baseDurationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          baseRate: (s.baseRate !== null && s.baseRate !== undefined && s.baseRate !== '') ? parseFloat(s.baseRate) : null,
          overtimeRatePerHour: (s.overtimeRatePerHour !== null && s.overtimeRatePerHour !== undefined && s.overtimeRatePerHour !== '') ? parseFloat(s.overtimeRatePerHour) : null,
          minimumBookingFee: (s.minimumBookingFee !== null && s.minimumBookingFee !== undefined && s.minimumBookingFee !== '') ? parseFloat(s.minimumBookingFee) : null,
          fixedPricingType: s.pricingModel === 'per_attendee' ? 'per_attendee' : (s.pricingModel === 'fixed_price' ? 'fixed_price' : null),
          fixedPrice: (s.fixedPrice !== null && s.fixedPrice !== undefined && s.fixedPrice !== '') ? parseFloat(s.fixedPrice) : null,
          pricePerPerson: (s.pricePerPerson !== null && s.pricePerPerson !== undefined && s.pricePerPerson !== '') ? parseFloat(s.pricePerPerson) : null,
          minimumAttendees: (s.minimumAttendees !== null && s.minimumAttendees !== undefined && s.minimumAttendees !== '') ? parseInt(s.minimumAttendees) : null,
          maximumAttendees: (s.maximumAttendees !== null && s.maximumAttendees !== undefined && s.maximumAttendees !== '') ? parseInt(s.maximumAttendees) : null,
          price: s.vendorPrice || s.fixedPrice || 0
        })),
        services: services.map(s => ({
          name: s.name,
          description: s.vendorDescription || s.description || '',
          imageURL: s.imageURL || null,
          pricingModel: s.pricingModel || 'time_based',
          baseDurationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          baseRate: (s.baseRate !== null && s.baseRate !== undefined && s.baseRate !== '') ? parseFloat(s.baseRate) : null,
          overtimeRatePerHour: (s.overtimeRatePerHour !== null && s.overtimeRatePerHour !== undefined && s.overtimeRatePerHour !== '') ? parseFloat(s.overtimeRatePerHour) : null,
          minimumBookingFee: (s.minimumBookingFee !== null && s.minimumBookingFee !== undefined && s.minimumBookingFee !== '') ? parseFloat(s.minimumBookingFee) : null,
          fixedPricingType: s.pricingModel === 'per_attendee' ? 'per_attendee' : (s.pricingModel === 'fixed_price' ? 'fixed_price' : null),
          fixedPrice: (s.fixedPrice !== null && s.fixedPrice !== undefined && s.fixedPrice !== '') ? parseFloat(s.fixedPrice) : null,
          pricePerPerson: (s.pricePerPerson !== null && s.pricePerPerson !== undefined && s.pricePerPerson !== '') ? parseFloat(s.pricePerPerson) : null,
          minimumAttendees: (s.minimumAttendees !== null && s.minimumAttendees !== undefined && s.minimumAttendees !== '') ? parseInt(s.minimumAttendees) : null,
          maximumAttendees: (s.maximumAttendees !== null && s.maximumAttendees !== undefined && s.maximumAttendees !== '') ? parseInt(s.maximumAttendees) : null,
          durationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          linkedPredefinedServiceId: s.id,
          categoryName: s.category || null
        }))
      };
      
      const response = await fetch(`${API_BASE_URL}/vendors/setup/step3-services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        showBanner('Services saved successfully!', 'success');
        loadServices();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save services');
      }
    } catch (error) {
      console.error('Error saving services:', error);
      showBanner('Failed to save services: ' + error.message, 'error');
    }
  };

  const filteredServices = availableServices.filter(s =>
    !services.some(selected => selected.id === s.id) &&
    (searchQuery === '' ||
     s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())))
  );



  // Filter services for package modal - only show vendor's individual services (not predefined)
  const filteredPackageServices = services
    .filter(s => 
      packageServiceSearch === '' ||
      (s.name || s.ServiceName || '').toLowerCase().includes(packageServiceSearch.toLowerCase())
    );

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-briefcase"></i>
          </span>
          Packages & Services
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Create packages to bundle multiple services together with special pricing, or add individual services.
        </p>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
          <button
            onClick={() => setActiveTab('packages')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'packages' ? '2px solid #222' : '2px solid transparent',
              color: activeTab === 'packages' ? '#222' : '#6b7280',
              fontWeight: activeTab === 'packages' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.95rem',
              marginBottom: '-1px'
            }}
          >
            <i className="fas fa-box" style={{ marginRight: '0.5rem', color: '#5e72e4' }}></i>
            Packages {packages.length > 0 && <span style={{ background: '#5e72e4', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{packages.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'services' ? '2px solid #222' : '2px solid transparent',
              color: activeTab === 'services' ? '#222' : '#6b7280',
              fontWeight: activeTab === 'services' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.95rem',
              marginBottom: '-1px'
            }}
          >
            <i className="fas fa-concierge-bell" style={{ marginRight: '0.5rem', color: '#5e72e4' }}></i>
            Individual Services {selectedCount > 0 && <span style={{ background: '#5e72e4', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{selectedCount}</span>}
          </button>
        </div>
        
        {/* Loading State */}
        {loading && (
          <SkeletonLoader variant="service-card" count={3} />
        )}

        {/* Packages Tab Content - Airbnb-style Horizontal Cards */}
        {activeTab === 'packages' && !loading && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h5 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: '1.25rem' }}>Your Packages</h5>
              <button
                onClick={handleCreatePackage}
                style={{
                  padding: '10px 20px',
                  background: '#222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-plus"></i> Create Package
              </button>
            </div>

            {/* Package List - Clean Horizontal Card Design (matches VendorProfilePage) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {packages.map((pkg, index) => (
                <div 
                  key={pkg.PackageID || index} 
                  style={{ 
                    padding: '1rem',
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Package Image - Small Square */}
                    <div style={{
                      flexShrink: 0,
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {pkg.ImageURL ? (
                        <img src={pkg.ImageURL} alt={pkg.PackageName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="fas fa-box" style={{ color: '#9ca3af', fontSize: '2rem' }}></i>
                      )}
                    </div>
                    
                    {/* Package Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#222', margin: '0 0 0.35rem 0' }}>
                            {pkg.PackageName}
                            {pkg.SalePrice && parseFloat(pkg.SalePrice) < parseFloat(pkg.Price) && (
                              <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginLeft: '0.5rem' }}>SALE!</span>
                            )}
                          </h3>
                          
                          {/* Pricing */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {pkg.SalePrice && parseFloat(pkg.SalePrice) < parseFloat(pkg.Price) ? (
                              <>
                                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#222' }}>
                                  ${parseFloat(pkg.SalePrice).toFixed(0)}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                  ${parseFloat(pkg.Price).toFixed(0)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#222' }}>
                                ${parseFloat(pkg.Price).toFixed(0)}
                              </span>
                            )}
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              / {pkg.PriceType === 'per_person' ? 'person' : 'package'}
                            </span>
                          </div>
                          
                          {/* Description */}
                          {pkg.Description && (
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
                              {pkg.Description.length > 80 ? pkg.Description.substring(0, 80) + '...' : pkg.Description}
                            </p>
                          )}
                          
                          {/* Included Services */}
                          {pkg.IncludedServices && pkg.IncludedServices.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {pkg.IncludedServices.slice(0, 4).map((svc, idx) => (
                                <span key={idx} style={{ 
                                  background: '#f3f4f6', 
                                  color: '#374151', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.8rem',
                                  fontWeight: 500
                                }}>
                                  {svc.name || svc.ServiceName}
                                </span>
                              ))}
                              {pkg.IncludedServices.length > 4 && (
                                <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500, padding: '4px 0' }}>
                                  +{pkg.IncludedServices.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleEditPackage(pkg)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              background: '#fff',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#374151'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.PackageID)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#dc2626'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Package Card - Horizontal */}
              <div 
                onClick={services.length > 0 ? handleCreatePackage : () => { showBanner('Please create individual services first', 'warning'); setActiveTab('services'); }}
                style={{
                  height: '80px',
                  border: '1px dashed #d1d5db',
                  borderRadius: '12px',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#fafafa';
                }}
              >
                <i className="fas fa-plus" style={{ fontSize: '1rem', color: '#6b7280' }}></i>
                <span style={{ fontWeight: 500, color: '#6b7280' }}>Add a package</span>
              </div>
            </div>

            {/* Save Button for Packages */}
            <div style={{ marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={() => showBanner('Packages saved!', 'success')}>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Services Container - Airbnb-style Horizontal Cards */}
        <div id="vendor-settings-services-container" style={{ display: !loading && activeTab === 'services' ? 'block' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: '1.25rem' }}>Your Services</h5>
            <span id="vendor-settings-selected-count" style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {selectedCount} added
            </span>
          </div>

          <div id="vendor-settings-services-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {services.map((service, index) => {
              const getCategoryIcon = () => {
                const catLower = (service.category || '').toLowerCase();
                const nameLower = (service.name || '').toLowerCase();
                
                if (catLower.includes('photo') || nameLower.includes('photo')) return 'fa-camera';
                if (catLower.includes('video') || nameLower.includes('video')) return 'fa-video';
                if (catLower.includes('music') || catLower.includes('dj') || nameLower.includes('music') || nameLower.includes('dj')) return 'fa-music';
                if (catLower.includes('cater') || nameLower.includes('food') || nameLower.includes('cater')) return 'fa-utensils';
                if (catLower.includes('venue') || nameLower.includes('venue') || nameLower.includes('space')) return 'fa-building';
                if (catLower.includes('decor') || catLower.includes('floral') || nameLower.includes('decor') || nameLower.includes('flower')) return 'fa-leaf';
                if (catLower.includes('entertainment') || nameLower.includes('perform')) return 'fa-masks-theater';
                if (catLower.includes('transport') || nameLower.includes('transport')) return 'fa-car';
                if (catLower.includes('beauty') || catLower.includes('wellness') || nameLower.includes('makeup') || nameLower.includes('spa')) return 'fa-spa';
                return 'fa-concierge-bell';
              };
              
              const getPricingDisplay = () => {
                if (service.pricingModel === 'time_based' && service.baseRate) {
                  return { price: `$${parseFloat(service.baseRate).toLocaleString()}`, suffix: 'base rate' };
                } else if (service.pricingModel === 'fixed_price' && service.fixedPrice) {
                  return { price: `$${parseFloat(service.fixedPrice).toLocaleString()}`, suffix: 'fixed' };
                } else if (service.pricingModel === 'per_attendee' && service.pricePerPerson) {
                  return { price: `$${parseFloat(service.pricePerPerson).toLocaleString()}`, suffix: '/ person' };
                }
                return { price: 'Price', suffix: 'not set' };
              };
              
              const pricing = getPricingDisplay();
              
              return (
                <div 
                  key={`service-${service.id}-${index}`} 
                  style={{ 
                    padding: '1rem',
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Service Icon - Small Square */}
                    <div style={{
                      flexShrink: 0,
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className={`fas ${getCategoryIcon()}`} style={{ color: '#5e72e4', fontSize: '1.75rem' }}></i>
                    </div>
                    
                    {/* Service Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#222', margin: '0 0 0.35rem 0' }}>
                            {service.name}
                          </h3>
                          
                          {/* Pricing */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#222' }}>
                              {pricing.price}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              {pricing.suffix}
                            </span>
                          </div>
                          
                          {/* Duration & Category */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ 
                              background: '#f3f4f6', 
                              color: '#374151', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}>
                              {service.vendorDuration 
                                ? (service.vendorDuration >= 60 
                                    ? Math.floor(service.vendorDuration/60) + ' hour' + (service.vendorDuration >= 120 ? 's' : '') 
                                    : service.vendorDuration + ' min')
                                : 'Duration TBD'}
                            </span>
                            {service.category && (
                              <span style={{ 
                                background: '#f3f4f6', 
                                color: '#374151', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontSize: '0.8rem',
                                fontWeight: 500
                              }}>
                                {service.category}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleEditService(service)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              background: '#fff',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#374151'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(service.id)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#dc2626'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Service Card - Horizontal */}
            <div 
              onClick={() => setShowServicePicker(true)}
              style={{
                height: '80px',
                border: '1px dashed #d1d5db',
                borderRadius: '12px',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: '12px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#222';
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.background = '#fafafa';
              }}
            >
              <i className="fas fa-plus" style={{ fontSize: '1rem', color: '#6b7280' }}></i>
              <span style={{ fontWeight: 500, color: '#6b7280' }}>Add a service</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary" id="vendor-settings-save-services" onClick={handleSaveServices}>
              Save
            </button>
          </div>
        </div>

        {/* Service Picker Modal */}
        {showServicePicker && (
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
            onClick={() => setShowServicePicker(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add Service</h3>
                  <button
                    onClick={() => setShowServicePicker(false)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '8px' }}>
                {filteredServices.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                    {searchQuery ? 'No services found' : 'All services have been added'}
                  </div>
                ) : (
                  filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => handleAddService(service)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 500 }}>{service.name}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {service.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {editingService && (
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
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={() => setEditingService(null)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{editingService.name}</h3>
                  <button
                    onClick={() => setEditingService(null)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto' }}>
                {/* Pricing Model */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pricing Model *
                  </label>
                  <select
                    value={editForm.pricingModel}
                    onChange={(e) => setEditForm({ ...editForm, pricingModel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f9fafb'
                    }}
                  >
                    <option value="time_based">Time-based (Hourly)</option>
                    <option value="fixed_price">Fixed Price</option>
                    <option value="per_attendee">Per Attendee</option>
                  </select>
                </div>

                {/* Time-based Fields */}
                {editForm.pricingModel === 'time_based' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Base Duration (min) *
                        </label>
                        <input
                          type="number"
                          value={editForm.vendorDuration}
                          onChange={(e) => setEditForm({ ...editForm, vendorDuration: e.target.value })}
                          min="15"
                          step="15"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Base Rate ($) *
                        </label>
                        <input
                          type="number"
                          value={editForm.baseRate}
                          onChange={(e) => setEditForm({ ...editForm, baseRate: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Overtime ($/hr) *
                        </label>
                        <input
                          type="number"
                          value={editForm.overtimeRatePerHour}
                          onChange={(e) => setEditForm({ ...editForm, overtimeRatePerHour: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Price Fields */}
                {editForm.pricingModel === 'fixed_price' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      Fixed Price ($) *
                    </label>
                    <input
                      type="number"
                      value={editForm.fixedPrice}
                      onChange={(e) => setEditForm({ ...editForm, fixedPrice: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#f9fafb'
                      }}
                    />
                  </div>
                )}

                {/* Per Attendee Fields */}
                {editForm.pricingModel === 'per_attendee' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Price Per Person ($) *
                        </label>
                        <input
                          type="number"
                          value={editForm.pricePerPerson}
                          onChange={(e) => setEditForm({ ...editForm, pricePerPerson: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Min Attendees *
                        </label>
                        <input
                          type="number"
                          value={editForm.minimumAttendees}
                          onChange={(e) => setEditForm({ ...editForm, minimumAttendees: e.target.value })}
                          min="1"
                          step="1"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Max Attendees *
                        </label>
                        <input
                          type="number"
                          value={editForm.maximumAttendees}
                          onChange={(e) => setEditForm({ ...editForm, maximumAttendees: e.target.value })}
                          min="1"
                          step="1"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Your Description *
                  </label>
                  <textarea
                    value={editForm.vendorDescription}
                    onChange={(e) => setEditForm({ ...editForm, vendorDescription: e.target.value })}
                    placeholder="Add any specific details about how you provide this service..."
                    rows="3"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f9fafb',
                      resize: 'vertical',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setEditingService(null)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: 'transparent',
                    color: '#6366f1',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#eef2ff'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Package Modal */}
        {showPackageModal && (
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
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={() => setShowPackageModal(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {editingPackage ? 'Edit Package' : 'Create Package'}
                  </h3>
                  <button
                    onClick={() => setShowPackageModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {/* Package Image */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Package Image
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: '120px',
                      height: '90px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb'
                    }}>
                      {packageForm.imageURL ? (
                        <img src={packageForm.imageURL} alt="Package" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePackageImageUpload}
                        style={{ display: 'none' }}
                        id="package-image-upload"
                      />
                      <label
                        htmlFor="package-image-upload"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Package Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    placeholder="e.g., Friday / Sunday Wedding"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Description
                  </label>
                  <textarea
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    placeholder="Describe what's included in this package..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Price *
                    </label>
                    <input
                      type="number"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Sale Price
                    </label>
                    <input
                      type="number"
                      value={packageForm.salePrice}
                      onChange={(e) => setPackageForm({ ...packageForm, salePrice: e.target.value })}
                      placeholder="Optional"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Price Type
                    </label>
                    <select
                      value={packageForm.priceType}
                      onChange={(e) => setPackageForm({ ...packageForm, priceType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="per_person">Per Person</option>
                    </select>
                  </div>
                </div>

                {/* Included Services */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Included Services
                  </label>
                  <input
                    type="text"
                    value={packageServiceSearch}
                    onChange={(e) => setPackageServiceSearch(e.target.value)}
                    placeholder="Search services to add..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}
                  />
                  
                  {/* Selected Services */}
                  {packageForm.includedServices.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '12px' }}>
                      {packageForm.includedServices.map((svc, idx) => (
                        <span 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f3f4f6',
                            color: '#222',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          {svc.name}
                          <button
                            onClick={() => toggleServiceInPackage(svc)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          >
                            <i className="fas fa-times" style={{ fontSize: '0.7rem', color: '#6b7280' }}></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Available Services List */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fafafa' }}>
                    {filteredPackageServices.slice(0, 10).map((service, idx) => {
                      const serviceId = service.id || service.PredefinedServiceID;
                      const isSelected = packageForm.includedServices.some(s => (s.id || s.PredefinedServiceID) === serviceId);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleServiceInPackage(service)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isSelected ? '#eff6ff' : 'white',
                            transition: 'background 0.15s'
                          }}
                          onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                        >
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#222' }}>{service.name || service.ServiceName}</span>
                          {isSelected && <i className="fas fa-check-circle" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fine Print */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Fine Print / Terms
                  </label>
                  <textarea
                    value={packageForm.finePrint}
                    onChange={(e) => setPackageForm({ ...packageForm, finePrint: e.target.value })}
                    placeholder="e.g., Available on Friday or Sunday. Not available on long weekends."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowPackageModal(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #222',
                    background: 'transparent',
                    color: '#222',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePackage}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: '#222',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#000'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#222'; }}
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ServicesPackagesPanel;
