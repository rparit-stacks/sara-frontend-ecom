import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { TemplateBuilder } from '@/components/admin/whatsapp-cloud/TemplateBuilder';
import { ErrorNote } from '@/components/admin/whatsapp-cloud/shared';
import { whatsappCloudApi } from '@/lib/api';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background p-6 text-center">{children}</div>
);

/** Full-screen editor for both creating a template (/templates/new) and editing one (/templates/:key/edit). */
const WhatsAppTemplateEditor = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const editing = !!key;
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates });
  const platform = useQuery({ queryKey: ['waCloudPlatformTemplates'], queryFn: whatsappCloudApi.platformTemplates, retry: false });

  const template = editing ? (templates.data ?? []).find((t) => t.key === decodeURIComponent(key!)) : undefined;
  const back = () => navigate('/admin-sara/whatsapp/templates');

  if (templates.isLoading) return <Centered><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Centered>;
  if (templates.isError) return <Centered><div className="max-w-md space-y-3"><ErrorNote error={templates.error} /><Link className="text-sm text-primary underline" to="/admin-sara/whatsapp/templates">Back to templates</Link></div></Centered>;
  if (editing && !template) return <Centered><p className="text-sm">This template was not found. It may have been deleted. <Link className="text-primary underline" to="/admin-sara/whatsapp/templates">Back to templates</Link></p></Centered>;

  return (
    <TemplateBuilder
      key={template ? `${template.id}-${template.updatedAt}` : 'new'}
      asPage
      onClose={back}
      template={template ?? null}
      platform={template ? (platform.data ?? []).find((p) => p.name === template.key) ?? null : null}
      existingNames={(templates.data ?? []).map((t) => t.key)}
    />
  );
};
export default WhatsAppTemplateEditor;
