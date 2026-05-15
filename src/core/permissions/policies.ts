import { Role } from '../../constants/modules';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  superadmin: [
    'admin.super',
    'membership.access',
    'finance.access', 'finance.expense.approve', 'finance.payroll.manage',
    'attendance.access', 
    'bible_school.access', 'bible_school.exam.create',
    'events.access', 'events.emergency.manage',
    'welfare.access',
    'departments.access',
    'ministries.access',
    'communications.access',
    'branch.access', 'district.access', 'national.access'
  ],
  admin: [
    'membership.access',
    'finance.access', 'finance.expense.approve',
    'attendance.access', 
    'bible_school.access', 'bible_school.exam.create',
    'events.access', 'events.emergency.manage',
    'welfare.access',
    'departments.access',
    'ministries.access',
    'communications.access',
    'branch.access'
  ],
  branch_admin: [
    'membership.access',
    'finance.access',
    'attendance.access',
    'bible_school.access',
    'events.access',
    'welfare.access',
    'departments.access',
    'ministries.access',
    'communications.access',
    'branch.access'
  ],
  district: [
    'membership.access',
    'finance.access',
    'attendance.access',
    'bible_school.access',
    'events.access',
    'welfare.access',
    'departments.access',
    'ministries.access',
    'communications.access',
    'branch.access', 'district.access'
  ],
  pastor: [
    'membership.access',
    'attendance.access',
    'bible_school.access',
    'events.access',
    'welfare.access',
    'departments.access',
    'ministries.access',
    'communications.access',
    'branch.access'
  ],
  finance: [
    'finance.access', 'finance.expense.approve', 'finance.payroll.manage',
    'branch.access'
  ],
  member: [
    'membership.view_own',
    'events.access', // usually can view public events
    'bible_school.access', // can view courses
    'communications.access' // can view feed
  ]
};

export const getPermissionsForRole = (role: Role | undefined | null): string[] => {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
};
