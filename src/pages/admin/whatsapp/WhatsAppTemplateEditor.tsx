import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { TemplateBuilder } from '@/components/admin/whatsapp-cloud/TemplateBuilder';
import { ErrorNote } from '@/components/admin/whatsapp-cloud/shared';
import { whatsappCloudApi } from '@/lib/api';

/** One page for both creating a template (/templates/new) and editing one (/templates/:key/edit). */
const WhatsAppTemplateEditor = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const editing = !!key;
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates });
  const platform = useQuery({ queryKey: ['waCloudPlatformTemplates'], queryFn: whatsappCloudApi.platformTemplates, retry: false });

  const template = editing ? (templates.data ?? []).find((t) => t.key === decodeURIComponent(key!)) : undefined;
  const back = () => navigate('/admin-sara/whatsapp/templates');

  return (
    <WhatsAppLayout title={editing ? 'Edit template' : 'New template'} subtitle={editing ? 'Change the wording or buttons. WhatsApp reviews it again after you save.' : 'Write a message and send it to WhatsApp for review. We check the rules as you go.'}>
      <Link to="/admin-sara/whatsapp/templates" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All templates</Link>
      {templates.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {templates.isError && <ErrorNote error={templates.error} />}
      {editing && templates.isSuccess && !template && <p className="rounded-xl border p-6 text-sm">This template was not found. It may have been deleted. <Link className="text-primary underline" to="/admin-sara/whatsapp/templates">Back to templates</Link></p>}
      {templates.isSuccess && (!editing || template) && (
        <TemplateBuilder
          key={template ? `${template.id}-${template.updatedAt}` : 'new'}
          asPage
          onClose={back}
          template={template ?? null}
          platform={template ? (platform.data ?? []).find((p) => p.name === template.key) ?? null : null}
          existingNames={(templates.data ?? []).map((t) => t.key)}
        />
      )}
    </WhatsAppLayout>
  );
};
export default WhatsAppTemplateEditor;
