import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { MessageSquare, Globe, Video } from 'lucide-react';

const CommunicationHub = lazy(() => import('./pages/CommunicationHub'));
const CommunityFeed = lazy(() => import('./pages/CommunityFeed'));
const PublicUserProfile = lazy(() => import('./pages/PublicUserProfile'));
const MinistryChannels = lazy(() => import('./pages/MinistryChannels'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const LiveStreaming = lazy(() => import('./pages/LiveStreaming'));

export const communicationsModule: PlatformModule = {
  id: 'communications',
  name: 'Communications',
  category: 'operations',
  description: 'Messaging, announcements, media streams, and engagement systems',
  enabledByDefault: true,
  routes: [
    { path: 'communication', element: <CommunicationHub /> },
    { path: 'community-feed', element: <CommunityFeed /> },
    { path: 'community-profile/:userId', element: <PublicUserProfile /> },
    { path: 'ministry-channels', element: <MinistryChannels /> },
    { path: 'direct-messages', element: <DirectMessages /> },
    { path: 'direct-messages/:chatId', element: <DirectMessages /> },
    { path: 'streaming', element: <LiveStreaming /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Announcements', path: '/communication', icon: MessageSquare },
    { label: 'Social Hub', path: '/community-feed', icon: Globe },
    { label: 'Live Stream', path: '/streaming', icon: Video, category: 'spiritual' }
  ]
};
