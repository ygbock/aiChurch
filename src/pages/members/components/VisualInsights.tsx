import React, { useMemo } from 'react';
import { MemberData } from '@/types/membership';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface VisualInsightsProps {
  members: MemberData[];
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

export const VisualInsights: React.FC<VisualInsightsProps> = ({ members }) => {
  const { genderData, categoryData, growthData, statusData } = useMemo(() => {
    // Gender Distribution
    const genderMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const growthMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    members.forEach(member => {
      // Gender
      const gender = member.gender || 'Unknown';
      genderMap[gender] = (genderMap[gender] || 0) + 1;

      // Category
      const cat = member.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      // Status
      const status = member.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;

      // Growth over time (by month-year from joinDate or createdAt)
      let dateString = member.joinDate || member.conversionDate || member.visitDate || member.serviceDate;
      if (dateString) {
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            growthMap[monthYear] = (growthMap[monthYear] || 0) + 1;
          }
        } catch (e) {
            // Ignore parse errors
        }
      }
    });

    const formatData = (map: Record<string, number>) => 
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Sort growth data chronologically
    const sortedGrowth = Object.entries(growthMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      genderData: formatData(genderMap),
      categoryData: formatData(categoryMap),
      statusData: formatData(statusMap),
      growthData: sortedGrowth.slice(-12) // Last 12 months
    };
  }, [members]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-sm">
          <p className="font-bold text-slate-800">{payload[0].name}</p>
          <p className="text-blue-600 font-semibold text-lg">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (members.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center flex flex-col justify-center items-center h-[400px]">
        <p className="text-slate-500 font-medium">No members match your current filters to display insights.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
      {/* Gender Distribution */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Gender Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3b82f6' : entry.name === 'Female' ? '#ec4899' : COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category/Age Distribution */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Demographics</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Status Distribution */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Member Status</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Active' ? '#10b981' : entry.name === 'Inactive' ? '#f43f5e' : COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Trends */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-1">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Growth (Last 12 Months)</h3>
        {growthData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({active, payload}) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-sm border border-slate-700">
                          <p className="text-slate-400 mb-1">{payload[0].payload.name}</p>
                          <p className="font-bold text-lg">{payload[0].value} New</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
           <div className="h-[300px] flex items-center justify-center text-slate-500 font-medium">
             No recent growth data.
           </div>
        )}
      </div>
    </div>
  );
};
