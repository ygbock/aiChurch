import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { format } from 'date-fns';
import { showBrowserNotification, requestNotificationPermission } from '../lib/notifications';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function NotificationManager() {
  const { user } = useFirebase();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<any[]>([]);
  const notifiedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Initial permission request
    requestNotificationPermission();

    const path = `users/${user.uid}/reminders`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Listen for today's pending reminders
    const q = query(
      collection(db, path),
      where('date', '==', todayStr),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReminders(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      reminders.forEach(rem => {
        if (notifiedReminders.current.has(rem.id)) return;

        // Parse time (expecting HH:mm)
        const [hours, minutes] = rem.time.split(':').map(Number);
        const reminderMinutes = hours * 60 + minutes;

        // If the reminder is for right now (or within the last minute)
        if (reminderMinutes === currentMinutes) {
          triggerNotification(rem);
        }
      });
    };

    const triggerNotification = (rem: any) => {
      notifiedReminders.current.add(rem.id);
      
      // Browser Notification
      showBrowserNotification(rem.title, {
        body: rem.description || "Reminder from your FaithFlow Calendar",
        tag: rem.id
      });

      // UI Toast
      toast(rem.title, {
        description: rem.description || "It's time!",
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => navigate('/calendar')
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkReminders, 10000); // Check every 10s to be responsive but not heavy
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [reminders]);

  return null; // This component doesn't render anything
}
