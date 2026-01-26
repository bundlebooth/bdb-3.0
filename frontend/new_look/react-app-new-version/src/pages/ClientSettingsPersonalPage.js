import React from 'react';
import Header from '../components/Header';
import { PageLayout } from '../components/PageWrapper';
import PersonalDetailsPanel from '../components/Dashboard/panels/PersonalDetailsPanel';
import { useNavigate } from 'react-router-dom';
import './ClientPage.css';

function ClientSettingsPersonalPage() {
  const navigate = useNavigate();
  
  return (
    <PageLayout variant="default" pageClassName="client-page">
      <Header />
      <div className="client-page-container client-settings-full-width">
        <main className="client-page-main">
          <div className="client-page-content">
            <PersonalDetailsPanel onBack={() => navigate('/client/settings')} />
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export default ClientSettingsPersonalPage;
