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
  
  // Scoping
  districtId: string;
  branchId: string;
  branch?: string;
  
  // Membership Details
  level: MemberLevel;
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
  
  path?: string; // Firestore path
  createdAt: any;
  updatedAt: any;
}
