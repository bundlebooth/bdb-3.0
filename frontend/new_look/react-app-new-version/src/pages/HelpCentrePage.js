import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/PageWrapper';

function HelpCentrePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const collections = [
    { 
      id: 'most-asked', 
      title: 'Most Frequently Asked', 
      icon: 'fa-star',
      articleCount: 15,
      articles: [
        { id: 1, title: "PlanBeau's Health & Safety Measures" },
        { id: 2, title: "What is the cancellation and refund policy for clients and vendors?" }
      ],
      sections: [
        {
          title: 'For Vendors',
          articles: [
            { id: 3, title: "How does PlanBeau Referral Program work?" },
            { id: 4, title: "Instant Book" },
            { id: 5, title: "Calendar Sync" },
            { id: 6, title: "Why you should always keep your bookings on PlanBeau" },
            { id: 7, title: "How do I send a custom rate?" },
            { id: 8, title: "Tips for navigating your first booking" },
            { id: 9, title: "How much commission does PlanBeau take?" },
            { id: 10, title: "What is a site rep? How do I go about requesting one?" },
            { id: 11, title: "How is my payout calculated?" },
            { id: 12, title: "A client wants to add more hours to a booking. How do I do that?" },
            { id: 13, title: "Understanding and Customizing Activity Types on PlanBeau" }
          ]
        },
        {
          title: 'For Clients',
          articles: [
            { id: 14, title: "How do I modify an existing booking or change dates as a client?" },
            { id: 15, title: "How do I change my project type from still to motion (or vice versa)?" }
          ]
        }
      ]
    },
    { 
      id: 'general', 
      title: 'General', 
      icon: 'fa-file-lines',
      articleCount: 29,
      articles: []
    },
    { 
      id: 'booking-help', 
      title: 'Help with Booking', 
      icon: 'fa-calendar-days',
      articleCount: 62,
      articles: []
    },
    { 
      id: 'for-vendors', 
      title: 'For Vendors', 
      icon: 'fa-briefcase',
      articleCount: 48,
      articles: []
    },
    { 
      id: 'trust-safety', 
      title: 'Trust & Safety', 
      icon: 'fa-shield-halved',
      articleCount: 4,
      articles: []
    }
  ];

  const handleBack = () => {
    setSelectedCollection(null);
  };

  // Collection detail view - WHITE BACKGROUND like Giggster
  if (selectedCollection) {
    const collection = collections.find(c => c.id === selectedCollection);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        {/* Dark Header with Search */}
        <div style={{ 
          backgroundColor: '#1a1a1a',
          padding: '1rem 0'
        }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ 
              position: 'relative',
              backgroundColor: '#333',
              borderRadius: '8px'
            }}>
              <i className="fas fa-search" style={{ 
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888'
              }}></i>
              <input
                type="text"
                placeholder="Search for articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: '#333',
                  color: 'white'
                }}
              />
            </div>
          </div>
        </div>

        {/* White Content Area */}
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: 0
              }}
            >
              <span style={{ color: '#5B68F4' }}>All Collections</span>
              <span>›</span>
              <span>{collection.title}</span>
            </button>
          </div>

          {/* Collection Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <i className={`fas ${collection.icon}`} style={{ color: '#666', fontSize: '1rem' }}></i>
            </div>
            <h1 style={{ color: '#111', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              {collection.title}
            </h1>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              By PlanBeau Support Team · {collection.articleCount} articles
            </p>
          </div>

          {/* Top Articles in bordered box */}
          {collection.articles && collection.articles.length > 0 && (
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              marginBottom: '1.5rem',
              overflow: 'hidden'
            }}>
              {collection.articles.map((article, idx) => (
                <div 
                  key={article.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: idx < collection.articles.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: '#5B68F4' }}>{article.title}</span>
                  <i className="fas fa-chevron-right" style={{ color: '#ccc', fontSize: '0.75rem' }}></i>
                </div>
              ))}
            </div>
          )}

          {/* Sections with articles */}
          {collection.sections && collection.sections.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              marginBottom: '1.5rem',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '1rem 1.25rem', 
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#fafafa'
              }}>
                <h2 style={{ color: '#111', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                  {section.title}
                </h2>
              </div>
              {section.articles.map((article, idx) => (
                <div 
                  key={article.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: idx < section.articles.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: '#5B68F4' }}>{article.title}</span>
                  <i className="fas fa-chevron-right" style={{ color: '#ccc', fontSize: '0.75rem' }}></i>
                </div>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div style={{ 
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <Link to="/" style={{ color: '#999', fontSize: '0.9rem', textDecoration: 'none' }}>
              planbeau
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main collections view - Dark header, white content like Giggster
  return (
    <PageLayout variant="fullWidth" pageClassName="help-centre-page">
      {/* Dark Header */}
      <div style={{ 
        backgroundColor: '#1a1a1a',
        padding: '2.5rem 1.5rem 3rem',
        textAlign: 'center'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            color: '#5B68F4', 
            fontSize: '1.5rem', 
            fontWeight: '700',
            marginBottom: '1.5rem'
          }}>
            planbeau
          </h1>
        </Link>
        <h2 style={{ 
          color: 'white', 
          fontSize: '1.35rem', 
          fontWeight: '500',
          marginBottom: '2rem'
        }}>
          Advice and answers from the PlanBeau Team
        </h2>
        
        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ 
            position: 'relative',
            backgroundColor: '#333',
            borderRadius: '8px'
          }}>
            <i className="fas fa-search" style={{ 
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#888'
            }}></i>
            <input
              type="text"
              placeholder="Search for articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 2.75rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none',
                backgroundColor: '#333',
                color: 'white'
              }}
            />
          </div>
        </div>
      </div>

      {/* White Content Area - Collections List */}
      <div style={{ 
        maxWidth: '700px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem 3rem'
      }}>
        {collections.map(collection => (
          <div 
            key={collection.id}
            onClick={() => setSelectedCollection(collection.id)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className={`fas ${collection.icon}`} style={{ color: '#666', fontSize: '1rem' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: '#5B68F4', 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '0.25rem'
              }}>
                {collection.title}
              </h3>
              <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                By PlanBeau Support · {collection.articleCount} articles
              </p>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ 
          marginTop: '4rem',
          textAlign: 'center'
        }}>
          <Link to="/" style={{ color: '#ccc', fontSize: '0.9rem', textDecoration: 'none' }}>
            planbeau
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export default HelpCentrePage;
