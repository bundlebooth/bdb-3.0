import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

// Map category IDs to names for API calls
const CATEGORY_ID_TO_NAME = {
  'venue': 'Venues',
  'photo': 'Photo/Video',
  'music': 'Music/DJ',
  'catering': 'Catering',
  'entertainment': 'Entertainment',
  'decorations': 'Decorations',
  'decor': 'Decorations',
  'beauty': 'Beauty',
  'cake': 'Cake',
  'transportation': 'Transportation',
  'transport': 'Transportation',
  'planners': 'Planners',
  'planner': 'Planners',
  'fashion': 'Fashion',
  'stationery': 'Stationery',
  'experiences': 'Experiences'
};

// Map vendor category names to feature category names
const CATEGORY_TO_FEATURE_MAP = {
  'Venues': ['Venue Features'],
  'Photo/Video': ['Photography & Video'],
  'Music/DJ': ['Music & Entertainment'],
  'Catering': ['Catering & Bar'],
  'Entertainment': ['Music & Entertainment', 'Experience Services'],
  'Experiences': ['Experience Services'],
  'Decorations': ['Floral & Decor'],
  'Beauty': ['Beauty & Fashion Services'],
  'Cake': ['Cake & Desserts'],
  'Transportation': ['Transportation'],
  'Planners': ['Event Planning', 'Event Services'],
  'Fashion': ['Fashion & Attire', 'Beauty & Fashion Services'],
  'Stationery': ['Stationery & Paper Goods']
};

/**
 * CategoriesStep - Vendor onboarding step for selecting service category, subcategories,
 * event types, cultures, features, and category questions
 * Updated: Now matches CategoryServicesPanel from dashboard
 */
function CategoriesStep({ formData, onInputChange, setFormData, categories, currentUser }) {
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  
  // Event Types state
  const [eventTypes, setEventTypes] = useState([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  
  // Cultures state
  const [cultures, setCultures] = useState([]);
  const [loadingCultures, setLoadingCultures] = useState(false);
  
  // Features state
  const [featureCategories, setFeatureCategories] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  
  // Category Questions state
  const [categoryQuestions, setCategoryQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Load event types and cultures on mount
  useEffect(() => {
    loadEventTypes();
    loadCultures();
  }, []);

  // Fetch category-specific data when primary category changes
  useEffect(() => {
    if (!formData.primaryCategory) {
      setSubcategories([]);
      setFeatureCategories([]);
      setCategoryQuestions([]);
      return;
    }
    
    const categoryName = CATEGORY_ID_TO_NAME[formData.primaryCategory] || formData.primaryCategory;
    fetchSubcategories(categoryName);
    loadFeatures(categoryName);
    loadCategoryQuestions(categoryName);
  }, [formData.primaryCategory]);

  const loadEventTypes = async () => {
    try {
      setLoadingEventTypes(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vendors/lookup/event-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.eventTypes || []);
      }
    } catch (error) {
      console.error('Error loading event types:', error);
    } finally {
      setLoadingEventTypes(false);
    }
  };

  const loadCultures = async () => {
    try {
      setLoadingCultures(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vendors/lookup/cultures`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCultures(data.cultures || []);
      }
    } catch (error) {
      console.error('Error loading cultures:', error);
    } finally {
      setLoadingCultures(false);
    }
  };

  const fetchSubcategories = async (categoryName) => {
    if (!categoryName) return;
    
    setLoadingSubcategories(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vendors/lookup/subcategories?category=${encodeURIComponent(categoryName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const loadFeatures = async (categoryName) => {
    if (!categoryName) return;
    
    try {
      setLoadingFeatures(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vendors/features/all-grouped`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter categories based on vendor's category
        const applicableFeatureCategories = CATEGORY_TO_FEATURE_MAP[categoryName] || [];
        const catId = formData.primaryCategory;
        
        const filteredCategories = (data.categories || []).filter(cat => {
          const matchesByMap = applicableFeatureCategories.includes(cat.categoryName);
          const matchesByApplicable = cat.applicableVendorCategories === catId;
          return matchesByMap || matchesByApplicable;
        });
        
        // Filter out categories with no features
        const categoriesWithFeatures = filteredCategories.filter(cat => 
          cat.features && cat.features.length > 0 && cat.features[0]?.featureId
        );
        
        setFeatureCategories(categoriesWithFeatures);
      }
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const loadCategoryQuestions = async (categoryName) => {
    if (!categoryName) return;
    
    try {
      setLoadingQuestions(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vendors/category-questions/${encodeURIComponent(categoryName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategoryQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading category questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handlePrimaryChange = (categoryId) => {
    onInputChange('primaryCategory', categoryId);
    // Clear category-specific selections when category changes
    onInputChange('selectedSubcategories', []);
    onInputChange('selectedFeatures', []);
    if (setFormData) {
      setFormData(prev => ({ ...prev, categoryAnswers: {} }));
    }
  };

  const handleSubcategoryToggle = (subcategoryId) => {
    const currentSubcategories = formData.selectedSubcategories || [];
    const newSubcategories = currentSubcategories.includes(subcategoryId)
      ? currentSubcategories.filter(id => id !== subcategoryId)
      : [...currentSubcategories, subcategoryId];
    
    onInputChange('selectedSubcategories', newSubcategories);
  };

  const toggleEventType = (eventTypeId) => {
    const current = formData.selectedEventTypes || [];
    const newSelection = current.includes(eventTypeId)
      ? current.filter(id => id !== eventTypeId)
      : [...current, eventTypeId];
    onInputChange('selectedEventTypes', newSelection);
  };

  const toggleCulture = (cultureId) => {
    const current = formData.selectedCultures || [];
    const newSelection = current.includes(cultureId)
      ? current.filter(id => id !== cultureId)
      : [...current, cultureId];
    onInputChange('selectedCultures', newSelection);
  };

  const toggleFeature = (featureId) => {
    const current = formData.selectedFeatures || [];
    const newSelection = current.includes(featureId)
      ? current.filter(id => id !== featureId)
      : [...current, featureId];
    onInputChange('selectedFeatures', newSelection);
  };

  const handleQuestionAnswer = (questionId, answer) => {
    const currentAnswers = formData.categoryAnswers || {};
    if (setFormData) {
      setFormData(prev => ({
        ...prev,
        categoryAnswers: { ...currentAnswers, [questionId]: answer }
      }));
    }
  };

  const selectedSubcategoriesCount = (formData.selectedSubcategories || []).length;
  const selectedEventTypesCount = (formData.selectedEventTypes || []).length;
  const selectedCulturesCount = (formData.selectedCultures || []).length;
  const selectedFeaturesCount = (formData.selectedFeatures || []).length;

  return (
    <div className="categories-step">
      <h3 style={{ marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>
        Select Your Category <span style={{ color: '#ef4444' }}>*</span>
      </h3>
      <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
        Choose the main category that best describes your business. You can select specific services within this category next.
      </p>
      <div className="categories-grid">
        {categories.map(category => {
          const isSelected = formData.primaryCategory === category.id;
          return (
            <div
              key={category.id}
              className={`category-card ${isSelected ? 'selected primary' : ''}`}
              onClick={() => handlePrimaryChange(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-card-content">
                <h4 className="category-name">{category.name}</h4>
                <p className="category-description">{category.description}</p>
              </div>
              {isSelected && (
                <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
              )}
            </div>
          );
        })}
      </div>

      {/* Subcategories Section - Only show when a category is selected */}
      {formData.primaryCategory && (
        <>
          <h3 style={{ 
            marginTop: '2.5rem', 
            marginBottom: '1rem', 
            color: '#222', 
            fontSize: '1.125rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            Select Your Services
            {selectedSubcategoriesCount > 0 && (
              <span style={{
                background: '#5086E8',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '2px 10px',
                borderRadius: '12px'
              }}>
                {selectedSubcategoriesCount} selected
              </span>
            )}
          </h3>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Select all the specific services you offer within your category. This helps clients find exactly what they need.
          </p>
          
          {loadingSubcategories ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
              Loading services...
            </div>
          ) : subcategories.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '0.75rem' 
            }}>
              {subcategories.map(subcategory => {
                const isSelected = (formData.selectedSubcategories || []).includes(subcategory.SubcategoryID);
                return (
                  <div
                    key={subcategory.SubcategoryID}
                    onClick={() => handleSubcategoryToggle(subcategory.SubcategoryID)}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #5086E8' : '1px solid #e5e7eb',
                      background: isSelected ? '#f0f7ff' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #5086E8' : '2px solid #d1d5db',
                      background: isSelected ? '#5086E8' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && (
                        <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.7rem' }}></i>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: isSelected ? '#1e40af' : '#374151',
                      fontWeight: isSelected ? '500' : '400'
                    }}>
                      {subcategory.SubcategoryName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              No specific services available for this category yet.
            </div>
          )}

          {/* Event Types Section */}
          {eventTypes.length > 0 && (
            <>
              <h3 style={{ 
                marginTop: '2.5rem', 
                marginBottom: '1rem', 
                color: '#222', 
                fontSize: '1.125rem', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-calendar-alt" style={{ color: '#5086E8' }}></i>
                Event Types
                {selectedEventTypesCount > 0 && (
                  <span style={{
                    background: '#5086E8',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}>
                    {selectedEventTypesCount} selected
                  </span>
                )}
              </h3>
              <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                What types of events do you serve?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {eventTypes.map(et => {
                  const isSelected = (formData.selectedEventTypes || []).includes(et.EventTypeID);
                  return (
                    <button
                      key={et.EventTypeID}
                      type="button"
                      onClick={() => toggleEventType(et.EventTypeID)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: '24px',
                        border: isSelected ? '2px solid #222222' : '1px solid #d1d5db',
                        background: isSelected ? '#f9fafb' : 'white',
                        color: isSelected ? '#222222' : '#374151',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isSelected && <i className="fas fa-check" style={{ fontSize: '0.75rem' }}></i>}
                      {et.EventTypeName}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Cultures Served Section */}
          {cultures.length > 0 && (
            <>
              <h3 style={{ 
                marginTop: '2.5rem', 
                marginBottom: '1rem', 
                color: '#222', 
                fontSize: '1.125rem', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-globe" style={{ color: '#5086E8' }}></i>
                Cultures Served
                {selectedCulturesCount > 0 && (
                  <span style={{
                    background: '#5086E8',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}>
                    {selectedCulturesCount} selected
                  </span>
                )}
              </h3>
              <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Select the cultural communities you specialize in serving (optional)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {cultures.map(culture => {
                  const isSelected = (formData.selectedCultures || []).includes(culture.CultureID);
                  return (
                    <button
                      key={culture.CultureID}
                      type="button"
                      onClick={() => toggleCulture(culture.CultureID)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: '24px',
                        border: isSelected ? '2px solid #222222' : '1px solid #d1d5db',
                        background: isSelected ? '#f9fafb' : 'white',
                        color: isSelected ? '#222222' : '#374151',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isSelected && <i className="fas fa-check" style={{ fontSize: '0.75rem' }}></i>}
                      {culture.CultureName}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Features & Amenities Section */}
          {featureCategories.length > 0 && (
            <>
              <h3 style={{ 
                marginTop: '2.5rem', 
                marginBottom: '1rem', 
                color: '#222', 
                fontSize: '1.125rem', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-star" style={{ color: '#5086E8' }}></i>
                Features & Amenities
                {selectedFeaturesCount > 0 && (
                  <span style={{
                    background: '#5086E8',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}>
                    {selectedFeaturesCount} selected
                  </span>
                )}
              </h3>
              <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Select the amenities and capabilities you offer
              </p>
              {loadingFeatures ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Loading features...
                </div>
              ) : (
                <div>
                  {featureCategories.map(cat => (
                    <div key={cat.categoryName} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>
                        {cat.categoryName}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {cat.features.map(feature => {
                          const featureId = feature.FeatureID || feature.featureId;
                          const featureName = feature.FeatureName || feature.featureName;
                          const isSelected = (formData.selectedFeatures || []).includes(featureId);
                          return (
                            <button
                              key={featureId}
                              type="button"
                              onClick={() => toggleFeature(featureId)}
                              style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: isSelected ? '2px solid #222222' : '1px solid #d1d5db',
                                background: isSelected ? '#f9fafb' : 'white',
                                color: isSelected ? '#222222' : '#374151',
                                fontWeight: isSelected ? 500 : 400,
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              {isSelected && <i className="fas fa-check" style={{ fontSize: '0.7rem', marginRight: '0.375rem' }}></i>}
                              {featureName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Category Questions Section */}
          {categoryQuestions.length > 0 && (
            <>
              <h3 style={{ 
                marginTop: '2.5rem', 
                marginBottom: '1rem', 
                color: '#222', 
                fontSize: '1.125rem', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-question-circle" style={{ color: '#5086E8' }}></i>
                Category Questions
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Answer these questions to help clients understand your services better
              </p>
              {loadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Loading questions...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {categoryQuestions.map(q => {
                    const answer = (formData.categoryAnswers || {})[q.QuestionID] || '';
                    const options = q.Options ? q.Options.split(',').map(o => o.trim()) : [];
                    
                    return (
                      <div key={q.QuestionID} style={{ 
                        background: '#f9fafb', 
                        padding: '1.25rem', 
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <label style={{ 
                          display: 'block', 
                          fontWeight: 600, 
                          marginBottom: '0.5rem', 
                          fontSize: '0.95rem',
                          color: '#111827'
                        }}>
                          {q.QuestionText}
                          {q.IsRequired && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                        </label>
                        {q.Description && (
                          <p style={{ margin: '0 0 0.75rem 0', color: '#6b7280', fontSize: '0.85rem' }}>
                            {q.Description}
                          </p>
                        )}
                        
                        {/* Boolean/Toggle Question */}
                        {(q.QuestionType === 'boolean' || q.QuestionType === 'YesNo') ? (
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => handleQuestionAnswer(q.QuestionID, 'Yes')}
                              style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '8px',
                                border: answer === 'Yes' ? '2px solid #222222' : '1px solid #d1d5db',
                                background: answer === 'Yes' ? '#f9fafb' : 'white',
                                fontWeight: answer === 'Yes' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuestionAnswer(q.QuestionID, 'No')}
                              style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '8px',
                                border: answer === 'No' ? '2px solid #222222' : '1px solid #d1d5db',
                                background: answer === 'No' ? '#f9fafb' : 'white',
                                fontWeight: answer === 'No' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (q.QuestionType === 'MultiSelect' || q.QuestionType === 'multiselect') && options.length > 0 ? (
                          /* Multi-Select */
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {options.map(opt => {
                              const selectedOptions = answer ? answer.split(',').map(s => s.trim()) : [];
                              const isSelected = selectedOptions.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const newSelection = isSelected
                                      ? selectedOptions.filter(s => s !== opt)
                                      : [...selectedOptions, opt];
                                    handleQuestionAnswer(q.QuestionID, newSelection.join(','));
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    border: isSelected ? '2px solid #222222' : '1px solid #d1d5db',
                                    background: isSelected ? '#f9fafb' : 'white',
                                    fontWeight: isSelected ? 500 : 400,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {isSelected && <i className="fas fa-check" style={{ fontSize: '0.7rem', marginRight: '0.375rem' }}></i>}
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (q.QuestionType === 'Select' || q.QuestionType === 'select') && options.length > 0 ? (
                          /* Single Select Dropdown */
                          <select
                            value={answer}
                            onChange={(e) => handleQuestionAnswer(q.QuestionID, e.target.value)}
                            style={{
                              width: '100%',
                              maxWidth: '300px',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.95rem',
                              background: 'white'
                            }}
                          >
                            <option value="">Select an option</option>
                            {options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : q.QuestionType === 'Number' ? (
                          /* Number Input */
                          <input
                            type="number"
                            value={answer}
                            onChange={(e) => handleQuestionAnswer(q.QuestionID, e.target.value)}
                            placeholder="Enter a number"
                            style={{
                              width: '100%',
                              maxWidth: '200px',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.95rem'
                            }}
                          />
                        ) : q.QuestionType === 'textarea' ? (
                          /* Textarea */
                          <textarea
                            value={answer}
                            onChange={(e) => handleQuestionAnswer(q.QuestionID, e.target.value)}
                            placeholder="Enter your answer..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.95rem',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                        ) : (
                          /* Default Text Input */
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => handleQuestionAnswer(q.QuestionID, e.target.value)}
                            placeholder="Enter your answer..."
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.95rem'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CategoriesStep;
