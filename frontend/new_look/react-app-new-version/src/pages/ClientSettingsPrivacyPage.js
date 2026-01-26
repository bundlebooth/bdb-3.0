import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import PrivacySettingsPanel from '../components/Dashboard/panels/PrivacySettingsPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsPrivacyPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="default" pageClassName="client-page">
      <Header />
      <div className="client-page-container client-settings-full-width">
        <main className="client-page-main">
          <div className="client-page-content">
            <PrivacySettingsPanel onBack={() => navigate('/client/settings')} />
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export default ClientSettingsPrivacyPage;
