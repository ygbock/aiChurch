export type MemberStatus = 'Active' | 'Inactive' | 'Archived' | 'Deceased' | 'Transferred';
export type MemberLevel = 'Member' | 'Visitor' | 'Convert';
export type BaptismStatus = 'Baptised' | 'Not Baptised' | 'Pending';

export interface MemberData {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
  gender: 'Male' | 'Female';
  dob?: string;
  maritalStatus?: string;
  occupation?: string;
  photoUrl?: string;
  community?: string;
  area?: string;
  
  // Scoping
  districtId: string;
  branchId: string;
  branch?: string;
  
  // Membership Details
  level: MemberLevel;
  baptizedSubLevel?: 'leader' | 'worker' | 'disciple';
  status: MemberStatus;
  baptismStatus: BaptismStatus;
  isBaptised: boolean;
  joinDate: string;
  
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
  
  // First Timer Specifics
  street?: string;
  publicLandmark?: string;
  serviceDate?: string;
  firstVisit?: string;
  followUpStatus?: 'pending' | 'called' | 'visited' | 'completed';
  followUpNotes?: string;
  notes?: string;
  
  path?: string; // Firestore path
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
