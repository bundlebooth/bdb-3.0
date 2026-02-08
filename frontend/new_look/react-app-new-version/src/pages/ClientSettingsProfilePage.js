import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import ProfileEditPanel from '../components/Dashboard/panels/ProfileEditPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsProfilePage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="fullWidth" pageClassName="client-page client-settings-page">
      <Header />
      <ProfileEditPanel onClose={() => navigate('/client/settings')} onSave={() => navigate('/client/settings')} />
    </PageLayout>
  );
}

export default ClientSettingsProfilePage;
