import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function FAQsPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

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
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/faqs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
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
      const existingResponse = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/faqs`);
      const existingData = existingResponse.ok ? await existingResponse.json() : { faqs: [] };
      const existingFaqs = existingData.faqs || [];
      
      // Add new FAQ to the list
      const updatedFaqs = [...existingFaqs, { question: newFaq.question, answer: newFaq.answer }];
      
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/faqs/upsert`, {
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
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/faqs/${faqId}`, {
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
          Frequently Asked Questions
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Add common questions and answers to help clients learn more about your services.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Add FAQ Form */}
        <form onSubmit={handleAddFAQ} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Add New FAQ</h3>
          
          <div className="form-group">
            <label htmlFor="faq-question">Question <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              id="faq-question"
              placeholder="e.g., Do you offer refunds?"
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="faq-answer">Answer <span style={{ color: 'red' }}>*</span></label>
            <textarea
              id="faq-answer"
              rows="4"
              placeholder="Provide a detailed answer..."
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add FAQ
          </button>
        </form>

        {/* FAQs List */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your FAQs</h3>
        {faqs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-question-circle" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No FAQs added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqs.map((faq, index) => (
              <div key={faq.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'white' }}>
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
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDeleteFAQ(faq.id)}
                    style={{ color: 'var(--error)' }}
                  >
                    <i className="fas fa-trash"></i>
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
    </div>
  );
}

export default FAQsPanel;
