import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import PersonalDetailsPanel from '../components/Dashboard/panels/PersonalDetailsPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsPersonalPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <PersonalDetailsPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsPersonalPage;
