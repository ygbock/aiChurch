import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function createDefaultChannels(level: 'global' | 'district' | 'branch', targetId: string | null = null) {
  const defaultChannels = [
    {
      name: 'general-announcements',
      description: 'Important announcements and updates.',
      type: 'announcement',
    },
    {
      name: 'general-departments',
      description: 'General discussions for all department members.',
      type: 'department',
    },
    {
      name: 'general-ministries',
      description: 'General discussions for all ministries.',
      type: 'ministry',
    }
  ];

  try {
    const promises = defaultChannels.map(channel => 
      addDoc(collection(db, 'ministryChannels'), {
        name: channel.name,
        description: channel.description,
        type: channel.type,
        level: level,
        targetId: targetId,
        membersCount: 0,
        memberIds: [],
        createdAt: serverTimestamp()
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to create default channels:', error);
  }
}
