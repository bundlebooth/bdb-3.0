import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import LanguageCurrencyPanel from '../components/Dashboard/panels/LanguageCurrencyPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsLanguagePage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <LanguageCurrencyPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsLanguagePage;
