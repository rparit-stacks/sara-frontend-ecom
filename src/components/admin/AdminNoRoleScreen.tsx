import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shown to authenticated sub-admins who have no role assigned.
 * Main admin never sees this.
 */
export default function AdminNoRoleScreen() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin-sara/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="max-w-md w-full text-center bg-white border border-border rounded-2xl p-8 shadow-sm">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">No permissions allotted</h1>
        <p className="text-muted-foreground mb-6">
          Your account has no role yet, so you cannot open admin pages or tools.
          Please contact the main admin to assign a role and the tasks you need.
        </p>
        <Button onClick={logout} variant="outline" className="gap-2">
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
