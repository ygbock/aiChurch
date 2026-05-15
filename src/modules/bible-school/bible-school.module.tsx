import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { BookOpen } from 'lucide-react';

const BibleSchool = lazy(() => import('./pages/BibleSchool'));

export const bibleSchoolModule: PlatformModule = {
  id: 'bible-school',
  name: 'Bible School',
  category: 'spiritual',
  description: 'Manage bible school and curriculum',
  enabledByDefault: true,
  routes: [
    { path: 'bible-school', element: <BibleSchool /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Bible School', path: '/bible-school', icon: BookOpen }
  ]
};
