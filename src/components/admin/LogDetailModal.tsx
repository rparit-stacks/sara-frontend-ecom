import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Globe,
  Smartphone,
  User,
  Terminal,
  FileText
} from 'lucide-react';
import { logsApi, ApiLogDetailDTO } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

interface LogDetailModalProps {
  logId: number | null;
  open: boolean;
  onClose: () => void;
}

export const LogDetailModal = ({ logId, open, onClose }: LogDetailModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const { data: log, isLoading } = useQuery({
    queryKey: ['logDetail', logId],
    queryFn: () => logId ? logsApi.getLogById(logId) : null,
    enabled: !!logId && open,
  });
  
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };
  
  const getFlagBadge = (flag: string) => {
    switch (flag) {
      case 'GREEN':
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>;
      case 'ORANGE':
        return <Badge className="bg-orange-100 text-orange-700 gap-1"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
      case 'RED':
        return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" /> Error</Badge>;
      default:
        return <Badge>{flag}</Badge>;
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Terminal className="w-5 h-5" />
            Log Details
            {log && (
              <Badge 
                className={
                  log.statusCode >= 500 ? 'bg-red-100 text-red-700' :
                  log.statusCode >= 400 ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }
              >
                {log.statusCode}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : log ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Request Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Request Information</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Endpoint</div>
                      <div className="font-mono text-sm flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono">{log.httpMethod}</Badge>
                        <span className="break-all">{log.apiEndpoint}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${log.httpMethod} ${log.apiEndpoint}`, 'endpoint')}
                    >
                      {copiedField === 'endpoint' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        {getFlagBadge(log.errorFlag)}
                        <span className="font-semibold">{log.statusCode}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Response Time
                      </div>
                      <div className="font-semibold mt-1">
                        {log.responseTimeMs ? `${log.responseTimeMs}ms` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timestamp & Location */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Timestamp & Location</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Timestamp
                    </div>
                    <div className="font-medium mt-1">{formatTimestamp(log.timestamp)}</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Country
                      </div>
                      <div className="font-medium mt-1">{log.country || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Device
                      </div>
                      <div className="font-medium mt-1">{log.device || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">IP Address</div>
                      <div className="font-mono text-sm mt-1 flex items-center gap-2">
                        {log.ipAddress || 'N/A'}
                        {log.ipAddress && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(log.ipAddress, 'ip')}
                          >
                            {copiedField === 'ip' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* User Info */}
              {(log.userId || log.userEmail) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">User Information</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {log.userId && (
                        <div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> User ID
                          </div>
                          <div className="font-medium mt-1">{log.userId}</div>
                        </div>
                      )}
                      {log.userEmail && (
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium mt-1 flex items-center gap-2">
                            {log.userEmail}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(log.userEmail!, 'email')}
                            >
                              {copiedField === 'email' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* User Agent */}
              {log.userAgent && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">User Agent</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <code className="text-xs break-all">{log.userAgent}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => copyToClipboard(log.userAgent!, 'userAgent')}
                      >
                        {copiedField === 'userAgent' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Request Body */}
              {log.requestBody && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Request Body
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-white hover:bg-slate-800"
                      onClick={() => copyToClipboard(log.requestBody!, 'requestBody')}
                    >
                      {copiedField === 'requestBody' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(log.requestBody), null, 2);
                        } catch {
                          return log.requestBody;
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Request Params */}
              {log.requestParams && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Request Parameters</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <code className="text-xs break-all">{log.requestParams}</code>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {log.errorMessage && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-red-600 uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Error Message
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(log.errorMessage!, 'errorMessage')}
                    >
                      {copiedField === 'errorMessage' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-sm text-red-700 whitespace-pre-wrap break-all pr-8">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(log.errorMessage), null, 2);
                        } catch {
                          return log.errorMessage;
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Stack Trace */}
              {log.stackTrace && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-red-600 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Stack Trace
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-white hover:bg-slate-800"
                      onClick={() => copyToClipboard(log.stackTrace!, 'stackTrace')}
                    >
                      {copiedField === 'stackTrace' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-xs text-red-400 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                      {log.stackTrace}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Log not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
