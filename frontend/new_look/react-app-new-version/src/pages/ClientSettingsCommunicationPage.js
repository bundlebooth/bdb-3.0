import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import CommunicationPreferencesPanel from '../components/Dashboard/panels/CommunicationPreferencesPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsCommunicationPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <CommunicationPreferencesPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsCommunicationPage;
