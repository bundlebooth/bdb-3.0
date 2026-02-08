import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import SecurityPanel from '../components/Dashboard/panels/SecurityPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsSecurityPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <SecurityPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsSecurityPage;
