import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

/**
 * CategoryQuestionsStep - Displays category-specific questions for vendors to answer
 * Questions are loaded based on the vendor's selected primary category
 */
function CategoryQuestionsStep({ formData, setFormData, currentUser }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formData.primaryCategory) {
      loadQuestions();
    } else {
      setQuestions([]);
      setLoading(false);
    }
  }, [formData.primaryCategory]);

  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadExistingAnswers();
    }
  }, [currentUser?.vendorProfileId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/vendors/category-questions/${encodeURIComponent(formData.primaryCategory)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading category questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/category-answers`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const answersMap = {};
        (data.answers || []).forEach(a => {
          answersMap[a.QuestionID] = a.Answer;
        });
        setAnswers(answersMap);
        // Also update formData
        setFormData(prev => ({ ...prev, categoryAnswers: answersMap }));
      }
    } catch (error) {
      console.error('Error loading existing answers:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setFormData(prev => ({ ...prev, categoryAnswers: newAnswers }));
  };

  const handleSaveAnswers = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your basic profile first', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer
      }));

      const response = await fetch(
        `${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/category-answers`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ answers: answersArray })
        }
      );

      if (response.ok) {
        showBanner('Answers saved successfully!', 'success');
      } else {
        throw new Error('Failed to save answers');
      }
    } catch (error) {
      console.error('Error saving answers:', error);
      showBanner('Failed to save answers', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (question) => {
    const value = answers[question.QuestionID] || '';
    const isChecked = value === 'Yes' || value === 'true' || value === '1';
    
    switch (question.QuestionType) {
      case 'Checkbox':
      case 'YesNo':
        return (
          <label 
            key={question.QuestionID} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: isChecked ? '#f0fdf4' : '#fff',
              borderRadius: '8px',
              border: isChecked ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleAnswerChange(question.QuestionID, e.target.checked ? 'Yes' : 'No')}
              style={{ 
                width: '18px', 
                height: '18px', 
                accentColor: '#22c55e',
                cursor: 'pointer'
              }}
            />
            <span style={{ 
              fontSize: '0.95rem',
              color: isChecked ? '#166534' : '#374151',
              fontWeight: isChecked ? 500 : 400
            }}>
              {question.QuestionText}
            </span>
          </label>
        );

      case 'Select':
        const options = question.Options ? question.Options.split(',').map(o => o.trim()) : [];
        return (
          <div key={question.QuestionID} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#111827' }}>
              {question.QuestionText}
            </label>
            <select
              value={value}
              onChange={(e) => handleAnswerChange(question.QuestionID, e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="">Select an option</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'MultiSelect':
        const multiOptions = question.Options ? question.Options.split(',').map(o => o.trim()) : [];
        const selectedValues = value ? value.split(',').map(v => v.trim()) : [];
        return (
          <div key={question.QuestionID} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: '#111827' }}>
              {question.QuestionText}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {multiOptions.map(opt => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter(v => v !== opt)
                        : [...selectedValues, opt];
                      handleAnswerChange(question.QuestionID, newValues.join(','));
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid #5086E8' : '1px solid #d1d5db',
                      background: isSelected ? '#eff6ff' : 'white',
                      color: isSelected ? '#5086E8' : '#374151',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {isSelected && <i className="fas fa-check" style={{ fontSize: '0.7rem' }}></i>}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'Text':
      default:
        return (
          <div key={question.QuestionID} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#111827' }}>
              {question.QuestionText}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleAnswerChange(question.QuestionID, e.target.value)}
              placeholder="Enter your answer"
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!formData.primaryCategory) {
    return (
      <div style={{ 
        padding: '2rem', 
        background: '#fef3c7', 
        borderRadius: '12px', 
        textAlign: 'center',
        color: '#92400e'
      }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
        <p style={{ margin: 0, fontWeight: 500 }}>Please select a primary category first</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        background: '#f0f9ff', 
        borderRadius: '12px', 
        textAlign: 'center',
        color: '#0369a1'
      }}>
        <i className="fas fa-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
        <p style={{ margin: 0, fontWeight: 500 }}>No specific questions for this category yet</p>
      </div>
    );
  }

  // Count checked items
  const checkedCount = Object.values(answers).filter(v => v === 'Yes' || v === 'true' || v === '1').length;

  return (
    <div className="category-questions-step">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
          <strong>Select the services you offer.</strong> Checked items will appear with a ✓ on your profile. Unchecked items will show as not available.
        </p>
        <div style={{ 
          marginTop: '0.75rem', 
          padding: '0.5rem 1rem', 
          background: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#0369a1'
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '0.5rem', color: '#22c55e' }}></i>
          {checkedCount} of {questions.length} services selected
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.5rem',
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e5e7eb',
        padding: '1.25rem'
      }}>
        {questions.map(q => renderQuestion(q))}
      </div>

      {currentUser?.vendorProfileId && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleSaveAnswers}
            disabled={saving}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: saving ? '#9ca3af' : '#5086E8',
              color: 'white',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {saving ? 'Saving...' : 'Save Answers'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CategoryQuestionsStep;
