import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MessageHistoryProps {
  messages: any[];
}

export const MessageHistory = ({ messages }: MessageHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      SENT: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
    };
    
    return (
      <Badge variant={variants[status] as any || 'secondary'}>
        {status}
      </Badge>
    );
  };
  
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ORDER_NOTIFICATION: 'Order Notification',
      MANUAL: 'Manual',
      BROADCAST: 'Broadcast',
      CHATBOT_REPLY: 'Chatbot Reply',
    };
    return labels[type] || type;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Message History ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages sent yet</p>
          ) : (
            messages.map((message: any) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(message.status)}
                      <span className="font-medium">{message.recipientNumber}</span>
                      {getStatusBadge(message.status)}
                      <Badge variant="outline">{getTypeLabel(message.messageType)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.messageContent}</p>
                    {message.orderId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Order ID: {message.orderId}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {message.sentAt 
                      ? new Date(message.sentAt).toLocaleString()
                      : new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
