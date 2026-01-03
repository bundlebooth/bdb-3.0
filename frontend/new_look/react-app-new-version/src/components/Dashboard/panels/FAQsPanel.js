import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function FAQsPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  // Clear state when vendorProfileId changes
  useEffect(() => {
    setFaqs([]);
    setNewFaq({ question: '', answer: '' });
  }, [vendorProfileId]);

  useEffect(() => {
    if (vendorProfileId) {
      loadFAQs();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/faqs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // The endpoint returns an array directly
        const faqsArray = Array.isArray(data) ? data : (data.faqs || []);
        setFaqs(faqsArray.map(faq => ({
          id: faq.id || faq.FAQID,
          question: faq.question || faq.Question,
          answer: faq.answer || faq.Answer,
          displayOrder: faq.displayOrder || faq.DisplayOrder
        })));
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    
    if (!newFaq.question || !newFaq.answer) {
      showBanner('Please fill in both question and answer', 'error');
      return;
    }

    try {
      // Load existing FAQs first
      const existingResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/faqs`);
      const existingData = existingResponse.ok ? await existingResponse.json() : { faqs: [] };
      const existingFaqs = existingData.faqs || [];
      
      // Add new FAQ to the list
      const updatedFaqs = [...existingFaqs, { question: newFaq.question, answer: newFaq.answer }];
      
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ faqs: updatedFaqs })
      });
      
      if (response.ok) {
        showBanner('FAQ added successfully!', 'success');
        setNewFaq({ question: '', answer: '' });
        loadFAQs();
      } else {
        throw new Error('Failed to add FAQ');
      }
    } catch (error) {
      console.error('Error adding FAQ:', error);
      showBanner('Failed to add FAQ', 'error');
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        showBanner('FAQ deleted successfully!', 'success');
        loadFAQs();
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showBanner('Failed to delete FAQ', 'error');
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
            <i className="fas fa-question-circle"></i>
          </span>
          FAQs
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Create frequently asked questions to help clients learn more about your services and policies.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        <div id="faqs-list">
          {faqs.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No FAQs added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
              {faqs.map((faq, index) => (
                <div key={faq.id || index} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                      <span style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: 'var(--primary)', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        Q
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {faq.question}
                      </h4>
                    </div>
                    <button
                      type="button"
                      className="action-btn action-btn-delete"
                      onClick={() => handleDeleteFAQ(faq.id || index)}
                      title="Delete FAQ"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '2.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: 1.6 }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button id="add-faq-btn" className="btn btn-outline" onClick={handleAddFAQ}>Add FAQ</button>
          <button id="save-faqs-btn" className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default FAQsPanel;
