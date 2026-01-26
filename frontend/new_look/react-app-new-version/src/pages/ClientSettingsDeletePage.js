import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import DeleteAccountPanel from '../components/Dashboard/panels/DeleteAccountPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsDeletePage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="default" pageClassName="client-page">
      <Header />
      <div className="client-page-container client-settings-full-width">
        <main className="client-page-main">
          <div className="client-page-content">
            <DeleteAccountPanel onBack={() => navigate('/client/settings')} />
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export default ClientSettingsDeletePage;
