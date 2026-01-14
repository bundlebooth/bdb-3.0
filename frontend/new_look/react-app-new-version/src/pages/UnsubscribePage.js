import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const UnsubscribePage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [email, setEmail] = useState('');

  useEffect(() => {
    const processUnsubscribe = async () => {
      try {
        let url = `${API_BASE_URL}/users/unsubscribe/${token}`;
        if (category) {
          url += `?category=${category}`;
        }
        
        const response = await fetch(url);
        const html = await response.text();
        
        // The API returns HTML, but we want to show our own React page
        // So we'll call the API to process the unsubscribe, then show our UI
        if (response.ok) {
          setStatus('success');
          // Try to extract email from the response if possible
          const emailMatch = html.match(/class="email">([^<]+)</);
          if (emailMatch) {
            setEmail(emailMatch[1]);
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
      }
    };

    if (token) {
      processUnsubscribe();
    }
  }, [token, category]);

  const getCategoryLabel = () => {
    const labels = {
      'bookingConfirmations': 'booking confirmation',
      'bookingReminders': 'booking reminder',
      'bookingUpdates': 'booking update',
      'messages': 'message notification',
      'payments': 'payment notification',
      'promotions': 'promotional',
      'newsletter': 'newsletter',
      'marketing': 'marketing'
    };
    return labels[category] || 'marketing';
  };

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Processing...</h2>
          <p style={styles.text}>Please wait while we update your preferences.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconError}>
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 style={styles.title}>Link Expired or Invalid</h1>
          <p style={styles.text}>
            This unsubscribe link has expired or is invalid. Please log in to manage your email preferences.
          </p>
          <a href="/dashboard/settings" style={styles.button}>
            Manage Preferences
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconSuccess}>
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={styles.title}>You've Been Unsubscribed</h1>
        <p style={styles.text}>
          We've updated your email preferences{category ? ` for ${getCategoryLabel()} emails` : ''}. 
          You will no longer receive {getCategoryLabel()} emails{email ? ` at:` : '.'}
        </p>
        {email && <div style={styles.email}>{email}</div>}
        <p style={styles.textSmall}>Changed your mind? You can update your preferences anytime.</p>
        <a href="/dashboard/settings" style={styles.button}>
          Manage Preferences
        </a>
        <br />
        <a href="/" style={styles.link}>Return to PlanBeau</a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  iconSuccess: {
    width: '80px',
    height: '80px',
    background: '#d4edda',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: '#28a745'
  },
  iconError: {
    width: '80px',
    height: '80px',
    background: '#f8d7da',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: '#dc3545'
  },
  title: {
    color: '#333',
    fontSize: '24px',
    marginBottom: '16px',
    fontWeight: '600'
  },
  text: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '24px'
  },
  textSmall: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '32px'
  },
  email: {
    background: '#f8f9fa',
    padding: '12px 20px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: '24px',
    display: 'inline-block'
  },
  button: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '14px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginTop: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px'
  }
};

export default UnsubscribePage;
