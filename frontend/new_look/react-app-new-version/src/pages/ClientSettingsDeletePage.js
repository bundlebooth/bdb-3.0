import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import DeleteAccountPanel from '../components/Dashboard/panels/DeleteAccountPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsDeletePage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <DeleteAccountPanel onBack={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsDeletePage;
