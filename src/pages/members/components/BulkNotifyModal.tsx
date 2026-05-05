import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Send, Users, AlertCircle, Loader2 } from 'lucide-react';
import { MemberData } from '@/types/membership';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BulkNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMembers: MemberData[];
  onSuccess?: () => void;
}

export const BulkNotifyModal: React.FC<BulkNotifyModalProps> = ({ isOpen, onClose, selectedMembers, onSuccess }) => {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter members based on selected channel
  const eligibleMembers = selectedMembers.filter(m => {
    if (channel === 'email') return !!m.email;
    if (channel === 'sms') return !!m.phone;
    return false;
  });

  const handleSend = async () => {
    if (eligibleMembers.length === 0) {
      toast.error(`No selected members have valid ${channel === 'email' ? 'email addresses' : 'phone numbers'}.`);
      return;
    }
    
    if (!message.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }

    if (channel === 'email' && !subject.trim()) {
      toast.error("Subject is required for emails.");
      return;
    }

    setIsSending(true);
    
    try {
      // Simulate API call to notification service (e.g. SendGrid / Twilio)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Successfully sent ${channel.toUpperCase()} to ${eligibleMembers.length} members.`);
      setSubject('');
      setMessage('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Communication Hub">
      <div className="space-y-6">
        <div className="flex gap-4 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setChannel('email')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all",
              channel === 'email' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Mail size={16} />
            Email Broadcast
          </button>
          <button
            onClick={() => setChannel('sms')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all",
              channel === 'sms' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <MessageSquare size={16} />
            SMS Blast
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-1">
              {eligibleMembers.length} of {selectedMembers.length} selected members can receive this.
            </p>
            <p className="text-blue-700">
              Members without a registered {channel === 'email' ? 'email address' : 'phone number'} are automatically skipped.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {channel === 'email' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Subject
              </label>
              <input 
                type="text"
                placeholder="e.g. Important Update for this Sunday"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                disabled={isSending}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Message Body
            </label>
            <textarea 
              rows={6}
              placeholder={channel === 'email' ? "Dear member,\n\nI want to inform you that..." : "Enter your SMS message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 resize-none"
              disabled={isSending}
            />
            {channel === 'sms' && (
              <p className="text-xs text-slate-500 font-medium text-right mt-2 mr-1">
                {message.length} characters ({(Math.ceil((message.length || 1) / 160))} SMS segments)
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isSending}
            className="font-bold px-6 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={isSending || eligibleMembers.length === 0}
            className="font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send {channel.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
