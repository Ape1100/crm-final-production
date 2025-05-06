import { useState, useEffect } from 'react';
import { CheckCircle, Trash2, RefreshCw, Bell, MailOpen, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  type: 'email' | 'system';
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  invoice_id?: string;
}

interface EmailOpen {
  id: string;
  invoice_id: string;
  opened_at: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [emailOpens, setEmailOpens] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel('email_opens')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'email_opens'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchEmailOpens(invoiceIds: string[]) {
    if (invoiceIds.length === 0) return {};
    
    try {
      const { data: emailOpensData, error } = await supabase
        .from('email_opens')
        .select('invoice_id')
        .in('invoice_id', invoiceIds);

      if (error) throw error;

      // Count opens per invoice
      const opens: Record<string, number> = {};
      emailOpensData?.forEach(open => {
        if (open.invoice_id) {
          opens[open.invoice_id] = (opens[open.invoice_id] || 0) + 1;
        }
      });

      return opens;
    } catch (error) {
      console.error('Error fetching email opens:', error);
      return {};
    }
  }

  async function fetchMessages() {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unique invoice IDs from messages
      const invoiceIds = messagesData
        ?.filter(msg => msg.invoice_id)
        .map(msg => msg.invoice_id as string) || [];

      // Fetch email opens for these invoices
      const opens = await fetchEmailOpens([...new Set(invoiceIds)]);

      setMessages(messagesData || []);
      setEmailOpens(opens);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.read;
    if (filter === 'read') return msg.read;
    return true;
  });

  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Messages</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={() => fetchMessages()}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any messages yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                !message.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  {message.type === 'email' ? (
                    message.invoice_id && emailOpens[message.invoice_id] ? (
                      <MailOpen className="h-6 w-6 text-green-600" />
                    ) : (
                      <Mail className="h-6 w-6 text-blue-600" />
                    )
                  ) : (
                    <Bell className="h-6 w-6 text-yellow-600" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {message.subject}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {message.content}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!message.read && (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}