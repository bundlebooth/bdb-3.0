import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import ProfileEditPanel from '../components/Dashboard/panels/ProfileEditPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsProfilePage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="default" pageClassName="client-page">
      <Header />
      <div className="client-page-container client-settings-full-width">
        <main className="client-page-main">
          <div className="client-page-content">
            <ProfileEditPanel onClose={() => navigate('/client/settings')} onSave={() => navigate('/client/settings')} />
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export default ClientSettingsProfilePage;
