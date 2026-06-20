import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientsList from './components/PatientsList';
import DietPlanBuilder from './components/DietPlanBuilder';
import PatientProfile from './components/PatientProfile';
import Settings from './components/Settings';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export type Page = 'dashboard' | 'patients' | 'diet-plans' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDietPlanId, setSelectedDietPlanId] = useState<string | null>(null);
  const [newDietPlanPatientId, setNewDietPlanPatientId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    if (selectedPatientId) {
      return (
        <PatientProfile
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
          onCreateDietPlan={() => {
            setNewDietPlanPatientId(selectedPatientId);
            setSelectedDietPlanId('new');
          }}
        />
      );
    }

    if (selectedDietPlanId) {
      return (
        <DietPlanBuilder
          dietPlanId={selectedDietPlanId}
          preselectedPatientId={newDietPlanPatientId}
          onBack={() => {
            setSelectedDietPlanId(null);
            setNewDietPlanPatientId(null);
          }}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onSelectPatient={setSelectedPatientId} />;
      case 'patients':
        return <PatientsList onSelectPatient={setSelectedPatientId} />;
      case 'diet-plans':
        return (
          <DietPlanBuilder
            onBack={() => setCurrentPage('dashboard')}
            onNewPlan={() => setSelectedDietPlanId('new')}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onSelectPatient={setSelectedPatientId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedPatientId(null);
          setSelectedDietPlanId(null);
          setNewDietPlanPatientId(null);
        }}
      />
      <main className="mr-64 p-8">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
