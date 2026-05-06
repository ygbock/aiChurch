import React from 'react';
import { User, Users, Heart, Briefcase, Calendar, MapPin, Building, Target, Zap } from 'lucide-react';
import { MemberData } from '../../../types/membership';

export function MemberBioTab({ member }: { member: MemberData }) {
  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return 'Not Provided';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Not Provided';
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
    } catch {
      return 'Not Provided';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Personal Info */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
          <User size={20} className="text-indigo-600" /> Personal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard label="Gender" value={member.gender} />
          <InfoCard label="Date of Birth" value={safeFormatDate(member.dob || member.dateOfBirth)} />
          <InfoCard label="Occupation" value={member.occupation || 'Not Provided'} />
          <InfoCard label="Marital Status" value={member.maritalStatus ? member.maritalStatus.charAt(0).toUpperCase() + member.maritalStatus.slice(1) : 'Not Provided'} />
        </div>
      </div>

      {/* Family Info */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 mt-8">
          <Heart size={20} className="text-rose-500" /> Family Ties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard label="Relational Partner (Spouse)" value={member.spouseName || 'None/Not Provided'} />
          <InfoCard label="Number of Children" value={member.numberOfChildren?.toString() || '0'} />
        </div>

        {member.children && member.children.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Children Details</h4>
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden text-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Full Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 w-1/3">Date of Birth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {member.children.map((child, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-medium text-slate-800">{child.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{safeFormatDate(child.dateOfBirth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ministry Involvement */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 mt-8">
          <Briefcase size={20} className="text-blue-600" /> Ministerial Involvement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard label="Leadership Role" value={member.leaderRole ? member.leaderRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'} />
          <InfoCard label="Sub Level" value={member.baptizedSubLevel ? member.baptizedSubLevel.charAt(0).toUpperCase() + member.baptizedSubLevel.slice(1) : 'None'} />
        </div>
        
        {(member.ministries?.length || member.assignedDepartment || member.departmentId) ? (
          <div className="mt-6">
             <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Active Ministries / Departments</h4>
             <div className="flex flex-wrap gap-2">
               {member.branchName && (
                 <span className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2">
                   <Building size={16} /> Branch: {member.branchName}
                 </span>
               )}
               {(member.departmentName || (member.assignedDepartment && member.assignedDepartment !== '_none')) && (
                 <span className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                   <Target size={16} /> Department: {member.departmentName || member.assignedDepartment}
                 </span>
               )}
               {member.ministries?.map((min, i) => (
                 <span key={i} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2">
                   <Zap size={16} /> {min}
                 </span>
               ))}
             </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
      <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">{value || 'N/A'}</p>
    </div>
  );
}
