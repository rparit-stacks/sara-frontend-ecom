import { NavLink } from 'react-router-dom';
import { Brain, ScrollText } from 'lucide-react';

const tab = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
  }`;

/** Tab bar shared by the API Logs page and the Incident RCA page. */
export const LogsTabs = () => (
  <div className="flex gap-1 border-b border-border">
    <NavLink to="/admin-sara/logs" end className={tab}><ScrollText className="h-4 w-4" /> API Logs</NavLink>
    <NavLink to="/admin-sara/logs/rca" className={tab}><Brain className="h-4 w-4" /> Incident RCA</NavLink>
  </div>
);
