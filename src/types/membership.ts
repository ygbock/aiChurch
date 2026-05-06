export type MemberStatus = 'Active' | 'Inactive' | 'Archived' | 'Deceased' | 'Transferred';
export type MemberLevel = 'Member' | 'Visitor' | 'Convert';
export type BaptismStatus = 'Baptised' | 'Not Baptised' | 'Pending';

export interface MemberData {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
  gender: 'male' | 'female' | 'Male' | 'Female' | string;
  dob?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  spouseName?: string;
  numberOfChildren?: number;
  children?: { fullName: string; dateOfBirth: string }[];
  occupation?: string;
  photoUrl?: string;
  community?: string;
  area?: string;
  street?: string;
  publicLandmark?: string;
  
  // Scoping
  districtId: string;
  branchId: string;
  branch?: string;
  branchName?: string;
  
  // Membership Details
  level: MemberLevel | string;
  status: MemberStatus | string;
  membershipLevel?: string;
  baptizedSubLevel?: 'leader' | 'worker' | 'disciple' | string;
  leaderRole?: 'pastor' | 'assistant_pastor' | 'department_head' | 'ministry_head' | string;
  baptismDate?: string;
  baptismStatus: BaptismStatus | string;
  isBaptised: boolean;
  joinDate: string;
  assignedDepartment?: string;
  departmentId?: string;
  departmentName?: string;
  
  // Category
  category?: 'Adult' | 'Youth' | 'Child' | 'Senior';
  
  // Specific to Converts
  conversionDate?: string;
  soulWinner?: string;
  decision?: string;
  
  // Specific to Visitors
  visitDate?: string;
  source?: string;
  invitedBy?: string;
  
  // Specific to First Timers
  serviceDate?: string;
  firstVisit?: string;
  followUpStatus?: 'pending' | 'called' | 'visited' | 'completed';
  followUpNotes?: string;
  notes?: string;

  ministries?: string[];
  tags?: string[];
  
  path?: string; // Firestore path
  transferHistory?: any[];
  createdAt: any;
  updatedAt: any;
}

export interface FirstTimerData {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  community: string;
  area: string;
  street: string;
  publicLandmark?: string;
  serviceDate: string;
  firstVisit: string;
  invitedBy?: string;
  branchId: string;
  districtId: string;
  status: 'new' | 'contacted' | 'followed_up' | 'converted';
  followUpStatus: 'pending' | 'called' | 'visited' | 'completed';
  followUpNotes?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}
