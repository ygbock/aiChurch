import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { MemberData } from '@/types/membership';

interface TagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberData;
  onSuccess: (newTags: string[]) => void;
}

const PREDEFINED_TAGS = [
  'Choir', 'Youth Leader', 'Volunteer', 'Needs Follow-up', 'First Timer', 
  'Usher', 'Media Team', 'Prayer Warrior', 'Children Ministry'
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({ isOpen, onClose, member, onSuccess }) => {
  const [tags, setTags] = useState<string[]>(member.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
       setTags(tags.filter(t => t !== tag));
    } else {
       setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    const tag = customTag.trim();
    if (!tags.includes(tag)) {
       setTags([...tags, tag]);
    }
    setCustomTag('');
  };

  const handleSave = async () => {
    if (!member.districtId || !member.branchId) {
       toast.error("Member location data is incomplete.");
       return;
    }

    try {
      const memberRef = doc(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}`);
      
      // Optimistic update
      toast.success("Tags updated successfully.");
      onSuccess(tags);
      onClose();
      
      // Background update
      updateDoc(memberRef, { tags }).catch(error => {
         console.error("Failed to save tags:", error);
         toast.error("Failed to save tags to server.");
      });
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Member Tags">
      <div className="space-y-6">
         <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Tags</h4>
            {tags.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No tags assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 group">
                    <Tag size={12} />
                    {tag}
                    <button 
                      onClick={() => toggleTag(tag)}
                      className="ml-1 opacity-50 hover:opacity-100 text-blue-900 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
         </div>

         <div>
           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Tags</h4>
           <div className="flex flex-wrap gap-2">
             {PREDEFINED_TAGS.filter(t => !tags.includes(t)).map(tag => (
               <button
                 key={tag}
                 onClick={() => toggleTag(tag)}
                 className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-all"
               >
                 + {tag}
               </button>
             ))}
           </div>
         </div>

         <div>
           <form onSubmit={handleAddCustomTag}>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Add Custom Tag</label>
             <div className="flex gap-2">
               <input 
                 type="text"
                 value={customTag}
                 onChange={e => setCustomTag(e.target.value)}
                 className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                 placeholder="e.g. Media Team"
               />
               <button 
                 type="submit"
                 disabled={!customTag.trim()}
                 className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50"
               >
                 Add
               </button>
             </div>
           </form>
         </div>

         <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isSaving}
            className="font-bold px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save Tags'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
