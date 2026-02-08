import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import PrivacySettingsPanel from '../components/Dashboard/panels/PrivacySettingsPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsPrivacyPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <PrivacySettingsPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsPrivacyPage;
