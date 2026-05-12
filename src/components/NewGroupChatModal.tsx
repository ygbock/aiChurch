import React, { useState } from 'react';
import Modal from './Modal';
import { Search, Users, X, UserPlus, Check } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

interface NewGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (participantIds: string[], groupName?: string) => void;
  users: any[];
}

export default function NewGroupChatModal({ isOpen, onClose, onSubmit, users }: NewGroupChatModalProps) {
  const { user } = useFirebase();
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');

  const filteredUsers = users.filter(u => 
    u.id !== user?.uid &&
    (u.fullName || u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.size === 0) return;
    
    onSubmit(Array.from(selectedUsers), selectedUsers.size > 1 ? groupName : undefined);
    
    // Reset
    setSelectedUsers(newSet => new Set());
    setGroupName('');
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={selectedUsers.size > 1 ? "New Group Chat" : "New Message"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedUsers.size > 1 && (
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Group Name (Optional)</label>
            <input 
              type="text"
              placeholder="E.g. Sunday Setup Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {selectedUsers.size > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from(selectedUsers).map(userId => {
              const u = users.find(u => u.id === userId);
              return (
                <div key={userId} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                  <span>{u?.fullName || u?.email}</span>
                  <button type="button" onClick={() => toggleUser(userId)} className="hover:text-rose-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2 no-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50">
          {filteredUsers.map(targetUser => {
            const isSelected = selectedUsers.has(targetUser.id);
            return (
              <button
                key={targetUser.id}
                type="button"
                onClick={() => toggleUser(targetUser.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {isSelected ? <Check size={14} /> : (targetUser.fullName?.charAt(0) || targetUser.email?.charAt(0) || '?')}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {targetUser.fullName || 'Unknown User'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {targetUser.email}
                    </div>
                  </div>
                </div>
                {!isSelected && (
                  <div className="text-slate-300">
                    <UserPlus size={16} />
                  </div>
                )}
              </button>
            )
          })}
          {filteredUsers.length === 0 && (
            <div className="p-4 text-center text-sm font-medium text-slate-500">
              No users found matching your search.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={selectedUsers.size === 0}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {selectedUsers.size > 1 ? (
              <><Users size={16} /> Create Group Chat</>
            ) : (
              <><Search size={16} /> Start Chat</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
