import { useAuth } from '../components/AuthProvider';
import { AdminDashboard } from './AdminDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { DirectorDashboard } from './DirectorDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { AuditorDashboard } from './AuditorDashboard';

export function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'ACCOUNTANT':
    case 'HEAD_ACCOUNTANT':
      return <AccountantDashboard />;
    case 'DIRECTOR':
      return <DirectorDashboard />;
    case 'SUPERVISOR':
      return <SupervisorDashboard />;
    case 'AUDITOR':
      return <AuditorDashboard />;
    default:
      return <div>Access Denied</div>;
  }
}
