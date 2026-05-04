import React, { useState, useEffect, useMemo } from "react";
import { useFirebase } from "@/components/FirebaseProvider";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  where,
  collectionGroup,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import {
  Plus,
  Droplets,
  CheckSquare,
  Search,
  FileEdit,
  Users,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  BarChart3,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface BaptismProgram {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  baptismDate?: string;
  baptismOfficiator?: string;
  baptismLocation?: string;
  status: "Pending" | "Approved" | "Completed" | "Rescheduled";
  createdAt: any;
  createdBy?: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

function BaptismAnalytics({ data, profile }: { data: any[]; profile: any }) {
  const [districtNames, setDistrictNames] = useState<Record<string, string>>(
    {},
  );
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [activeChart, setActiveChart] = useState<
    "year" | "age" | "gender" | "district" | "branch"
  >("year");

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const distSnap = await getDocs(collection(db, "districts"));
        const dNames: Record<string, string> = {};
        distSnap.forEach((doc) => {
          dNames[doc.id] = doc.data().name || doc.id;
        });
        setDistrictNames(dNames);

        const branchSnap = await getDocs(collectionGroup(db, "branches"));
        const bNames: Record<string, string> = {};
        branchSnap.forEach((doc) => {
          bNames[doc.id] = doc.data().name || doc.id;
        });
        setBranchNames(bNames);
      } catch (err) {
        console.error("Failed to fetch names for analytics", err);
      }
    };
    fetchNames();
  }, []);

  const stats = useMemo(() => {
    const byYear: Record<string, number> = {};
    const byGender: Record<string, number> = {};
    const byAge: Record<string, number> = {
      "0-12": 0,
      "13-19": 0,
      "20-35": 0,
      "36-50": 0,
      "51+": 0,
    };
    const byDistrict: Record<string, number> = {};
    const byBranch: Record<string, number> = {};

    data.forEach((m) => {
      // By Year
      let year = "Unknown";
      if (m.baptismDate) {
        year = new Date(m.baptismDate).getFullYear().toString();
      } else if (m.hqApprovedAt) {
        year = new Date(
          m.hqApprovedAt.toDate ? m.hqApprovedAt.toDate() : m.hqApprovedAt,
        )
          .getFullYear()
          .toString();
      }
      byYear[year] = (byYear[year] || 0) + 1;

      // By Gender
      const gender = m.gender
        ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1).toLowerCase()
        : "Unknown";
      byGender[gender] = (byGender[gender] || 0) + 1;

      // By Age
      if (m.dateOfBirth) {
        const age = differenceInYears(new Date(), new Date(m.dateOfBirth));
        if (age <= 12) byAge["0-12"]++;
        else if (age <= 19) byAge["13-19"]++;
        else if (age <= 35) byAge["20-35"]++;
        else if (age <= 50) byAge["36-50"]++;
        else byAge["51+"]++;
      }

      // By District/Branch
      if (m.districtId)
        byDistrict[m.districtId] = (byDistrict[m.districtId] || 0) + 1;
      if (m.branchId) byBranch[m.branchId] = (byBranch[m.branchId] || 0) + 1;
    });

    return {
      yearData: Object.entries(byYear)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      genderData: Object.entries(byGender).map(([name, value]) => ({
        name,
        value,
      })),
      ageData: Object.entries(byAge).map(([name, value]) => ({ name, value })),
      districtData: Object.entries(byDistrict)
        .map(([id, value]) => ({ name: districtNames[id] || id, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      branchData: Object.entries(byBranch)
        .map(([id, value]) => ({ name: branchNames[id] || id, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    };
  }, [data, districtNames, branchNames]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs uppercase font-bold text-slate-500 mb-2">
            Total Baptised Flow
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
              {data.length}
            </h3>
            <div className="bg-blue-50 p-4 rounded-full">
              <Droplets size={32} className="text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">
            {" "}
            Across {data.length > 0 ? stats.yearData.length : 0} recorded years
          </p>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">
              {activeChart === "year" && "Yearly Trend"}
              {activeChart === "age" && "Age Demographics"}
              {activeChart === "gender" && "Gender Distribution"}
              {activeChart === "branch" && "Top Branches"}
              {activeChart === "district" && "Top Districts"}
            </h3>
            <select
              value={activeChart}
              onChange={(e) => setActiveChart(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-white text-slate-700 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="year">Yearly Trend</option>
              <option value="age">Age Demographics</option>
              <option value="gender">Gender Distribution</option>
              {(profile?.role === "superadmin" ||
                profile?.role === "district") && (
                <option value="branch">Top Branches</option>
              )}
              {profile?.role === "superadmin" && (
                <option value="district">Top Districts</option>
              )}
            </select>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            {activeChart === "year" && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.yearData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "age" && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "gender" && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.genderData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {activeChart === "branch" && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.branchData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "district" && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.districtData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BaptismManagement() {
  const { profile } = useFirebase();
  const [districtNames, setDistrictNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const snap = await getDocs(collection(db, "districts"));
        const names: Record<string, string> = {};
        snap.forEach((doc) => {
          names[doc.id] = doc.data().name || doc.id;
        });
        setDistrictNames(names);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDistricts();
  }, []);

  const [programs, setPrograms] = useState<BaptismProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<BaptismProgram | null>(
    null,
  );

  // Stats / Candidates for selected program
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [editingProgram, setEditingProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    targetDate: "",
    baptismDate: "",
    baptismOfficiator: "",
    baptismLocation: "",
  });

  // Enrollment Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [selectedToEnroll, setSelectedToEnroll] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"workflow" | "analytics">(
    "workflow",
  );
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load programs
  useEffect(() => {
    const q = query(
      collection(db, "baptismPrograms"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BaptismProgram[];
        setPrograms(data);
        if (data.length > 0 && !selectedProgram) setSelectedProgram(data[0]);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "baptismPrograms");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [profile]);

  // Load candidates for selected program
  useEffect(() => {
    if (!selectedProgram) return;
    setLoadingCandidates(true);
    let q;

    // Only load members enrolled in this season
    if (profile?.role === "superadmin") {
      q = query(
        collectionGroup(db, "members"),
        where("baptismSeasonId", "==", selectedProgram.id),
      );
    } else if (profile?.role === "district") {
      q = query(
        collectionGroup(db, "members"),
        where("baptismSeasonId", "==", selectedProgram.id),
        where("districtId", "==", profile.districtId),
      );
    } else {
      q = query(
        collectionGroup(db, "members"),
        where("baptismSeasonId", "==", selectedProgram.id),
        where("branchId", "==", profile?.branchId || "none"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCandidates(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            refPath: doc.ref.path,
            ...doc.data(),
          })),
        );
        setLoadingCandidates(false);
      },
      (error) => {
        console.error(error);
        setLoadingCandidates(false);
      },
    );
    return () => unsubscribe();
  }, [selectedProgram, profile]);

  // Load analytics data
  useEffect(() => {
    if (activeTab !== "analytics") return;
    setLoadingAnalytics(true);
    let q;

    if (profile?.role === "superadmin") {
      q = query(
        collectionGroup(db, "members"),
        where("isBaptised", "==", true),
      );
    } else if (profile?.role === "district") {
      q = query(
        collectionGroup(db, "members"),
        where("isBaptised", "==", true),
        where("districtId", "==", profile.districtId),
      );
    } else {
      q = query(
        collectionGroup(db, "members"),
        where("isBaptised", "==", true),
        where("branchId", "==", profile?.branchId || "none"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAnalyticsData(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoadingAnalytics(false);
      },
      (error) => {
        console.error(error);
        setLoadingAnalytics(false);
      },
    );
    return () => unsubscribe();
  }, [activeTab, profile]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.title || !newProgram.targetDate) return;
    try {
      await addDoc(collection(db, "baptismPrograms"), {
        ...newProgram,
        status: "Pending",
        createdBy: profile?.uid,
        createdAt: serverTimestamp(),
      });
      setEditingProgram(false);
      setNewProgram({
        title: "",
        description: "",
        targetDate: "",
        baptismDate: "",
        baptismOfficiator: "",
        baptismLocation: "",
      });
      toast.success("Baptism season announced!");
    } catch (e: any) {
      toast.error("Failed to announce season: " + e.message);
    }
  };

  const loadEligibleMembers = async () => {
    try {
      if (!profile?.branchId) {
        toast.error("You must belong to a branch to enroll members.");
        return;
      }

      const q = query(
        collection(
          db,
          "districts",
          profile.districtId!,
          "branches",
          profile.branchId,
          "members",
        ),
        where("isBaptised", "==", false),
      );
      const snap = await getDocs(q);
      const eligible = snap.docs
        .map((d) => ({ id: d.id, refPath: d.ref.path, ...d.data() }))
        .filter((m: any) => m.baptismSeasonId !== selectedProgram?.id);
      setEligibleMembers(eligible);
    } catch (e: any) {
      toast.error("Failed to load eligible members.");
    }
  };

  const handleEnrollSelected = async () => {
    if (selectedToEnroll.length === 0 || !selectedProgram) return;
    setEnrolling(true);
    try {
      const promises = selectedToEnroll.map((memberId) => {
        const member = eligibleMembers.find((m) => m.id === memberId);
        if (!member) return Promise.resolve();
        return updateDoc(doc(db, member.refPath), {
          baptismSeasonId: selectedProgram.id,
          baptismSeasonName: selectedProgram.title,
          baptismStatus: "In Foundation Class",
          baptismEnrolledAt: serverTimestamp(),
        });
      });
      await Promise.all(promises);
      toast.success(
        `Successfully enrolled ${selectedToEnroll.length} candidates in Foundation Class!`,
      );
      setShowEnrollModal(false);
      setSelectedToEnroll([]);
    } catch (e: any) {
      toast.error("Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleProgramUpdate = async (programId: string, updates: any) => {
    try {
      await updateDoc(doc(db, "baptismPrograms", programId), updates);
      toast.success("Program updated successfully");
    } catch (error: any) {
      toast.error("Failed to update program: " + error.message);
    }
  };

  const handleStatusUpdate = async (
    candidateRef: string,
    newStatus: string,
  ) => {
    try {
      const updates: any = { baptismStatus: newStatus };
      if (newStatus === "Approved") {
        updates.isBaptised = true;
        updates.level = "Disciple";
        updates.baptismDate = new Date().toISOString();
        updates.hqApprovedAt = serverTimestamp();
        updates.hqApprovedBy = profile?.uid;
      }
      await updateDoc(doc(db, candidateRef), updates);
      toast.success(`Status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error("Failed to update candidate.");
    }
  };

  const filteredEligible = eligibleMembers.filter((m) =>
    (m.fullName || "").toLowerCase().includes(enrollSearch.toLowerCase()),
  );

  // Categorize candidates for UI
  const foundationClass = candidates.filter(
    (c) => c.baptismStatus === "In Foundation Class",
  );
  const districtReview = candidates.filter(
    (c) => c.baptismStatus === "Submitted to District",
  );
  const hqReview = candidates.filter(
    (c) => c.baptismStatus === "Submitted to HQ",
  );
  const approved = candidates.filter(
    (c) => c.baptismStatus === "Approved" || c.baptismStatus === "Baptised",
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Baptism Workflow
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage candidates from foundation class to full discipleship.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner min-w-[240px]">
          <button
            onClick={() => setActiveTab("workflow")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === "workflow"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Workflow
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart3 size={16} /> Analytics
          </button>
        </div>
      </div>

      {activeTab === "analytics" ? (
        loadingAnalytics ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-sm font-bold text-slate-500 uppercase">
              Loading Analytics...
            </p>
          </div>
        ) : (
          <BaptismAnalytics data={analyticsData} profile={profile} />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                  Baptism Seasons
                </h3>
                {profile?.role === "superadmin" && (
                  <button
                    onClick={() => setEditingProgram(!editingProgram)}
                    className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {editingProgram && (
                <form
                  onSubmit={handleCreateProgram}
                  className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 shrink-0"
                >
                  <input
                    type="text"
                    required
                    placeholder="Event Name e.g. Summer 2026"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={newProgram.title}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, title: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={newProgram.targetDate}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        targetDate: e.target.value,
                      })
                    }
                  />
                  <input
                    type="date"
                    placeholder="Baptism Date (Optional)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={newProgram.baptismDate}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        baptismDate: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Location (Optional)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={newProgram.baptismLocation}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        baptismLocation: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Officiator (Optional)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={newProgram.baptismOfficiator}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        baptismOfficiator: e.target.value,
                      })
                    }
                  />
                  <textarea
                    placeholder="Notes/Instructions..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 min-h-[60px]"
                    value={newProgram.description}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        description: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProgram(false)}
                      className="flex-1 bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {loading ? (
                  <div className="animate-pulse flex flex-col gap-3">
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">
                      No baptism programs found.
                    </p>
                  </div>
                ) : (
                  programs.map((prog) => (
                    <button
                      key={prog.id}
                      onClick={() => setSelectedProgram(prog)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                        selectedProgram?.id === prog.id
                          ? "bg-slate-900 border-slate-900 shadow-md transform scale-[1.02]"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {selectedProgram?.id === prog.id && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full rotate-12 -mr-4 -mt-4"></div>
                      )}
                      <h4
                        className={`font-black text-sm tracking-tight mb-1 ${selectedProgram?.id === prog.id ? "text-white" : "text-slate-900"}`}
                      >
                        {prog.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            prog.status === "Completed"
                              ? "bg-emerald-400"
                              : prog.status === "Approved"
                                ? "bg-blue-400"
                                : prog.status === "Pending"
                                  ? "bg-amber-400"
                                  : "bg-slate-400"
                          }`}
                        ></span>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            selectedProgram?.id === prog.id
                              ? "text-slate-300"
                              : prog.status === "Completed"
                                ? "text-emerald-600"
                                : prog.status === "Approved"
                                  ? "text-blue-600"
                                  : prog.status === "Pending"
                                    ? "text-amber-600"
                                    : "text-slate-500"
                          }`}
                        >
                          {prog.status}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedProgram ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50 relative overflow-hidden shrink-0">
                  <Droplets
                    size={120}
                    className="absolute -right-4 -bottom-8 text-blue-500/5 rotate-12"
                  />
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {selectedProgram.title}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedProgram.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <CheckSquare size={14} className="text-blue-500" />{" "}
                          Target Date: {selectedProgram.targetDate}
                        </div>
                        {selectedProgram.baptismDate && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <CheckSquare size={14} className="text-blue-500" />{" "}
                            Baptism Date: {selectedProgram.baptismDate}
                          </div>
                        )}
                        {selectedProgram.baptismLocation && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <CheckSquare size={14} className="text-blue-500" />{" "}
                            Location: {selectedProgram.baptismLocation}
                          </div>
                        )}
                        {selectedProgram.baptismOfficiator && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <CheckSquare size={14} className="text-blue-500" />{" "}
                            Officiator: {selectedProgram.baptismOfficiator}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end gap-3 shrink-0">
                      {profile?.role === "superadmin" && (
                        <select
                          value={selectedProgram.status}
                          onChange={(e) =>
                            handleProgramUpdate(selectedProgram.id, {
                              status: e.target.value,
                            })
                          }
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rescheduled">Rescheduled</option>
                        </select>
                      )}
                      {(profile?.role === "admin" ||
                        profile?.role === "member") &&
                        selectedProgram.status !== "Completed" && (
                          <button
                            onClick={() => {
                              setShowEnrollModal(true);
                              loadEligibleMembers();
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-px transition-all"
                          >
                            Enroll Candidates
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex-1 bg-slate-50/50">
                  {loadingCandidates ? (
                    <div className="flex justify-center py-12">
                      <Loader2
                        className="animate-spin text-blue-500"
                        size={32}
                      />
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                      <Users
                        size={48}
                        className="mx-auto text-slate-300 mb-4"
                      />
                      <h3 className="font-bold text-slate-700">
                        No Candidates Enrolled
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        Eligible branches have not enrolled any candidates to
                        the foundation class for this baptism season yet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-row xl:grid xl:grid-cols-4 gap-6 h-full overflow-x-auto snap-x no-scrollbar pb-4 p-2">
                      {/* Phase 1: Foundation Class */}
                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col shrink-0 w-[85vw] sm:w-[320px] xl:w-auto snap-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-300 rounded-t-2xl"></div>
                        <div className="mb-5 flex items-center justify-between border-b border-slate-200/60 pb-3 mt-1">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 text-xs shadow-sm">
                              1
                            </span>
                            Foundation
                          </h4>
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-xs font-bold">
                            {foundationClass.length}
                          </span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 min-h-[200px]">
                          {foundationClass.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group relative"
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <p className="font-bold text-sm text-slate-900 leading-tight">
                                    {c.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    Branch:{" "}
                                    <span className="text-slate-700 font-semibold">
                                      {c.branch || c.branchId}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              {(profile?.role === "admin" ||
                                profile?.role === "member") &&
                                selectedProgram.status !== "Completed" && (
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          c.refPath,
                                          "Submitted to District",
                                        )
                                      }
                                      className="w-full py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-bold rounded-lg transition-all"
                                    >
                                      Submit to District
                                    </button>
                                  </div>
                                )}
                            </div>
                          ))}
                          {foundationClass.length === 0 && (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phase 2: District Interview */}
                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col shrink-0 w-[85vw] sm:w-[320px] xl:w-auto snap-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 rounded-t-2xl"></div>
                        <div className="mb-5 border-b border-slate-200/60 pb-3 mt-1">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded bg-white border border-blue-200 text-blue-600 text-xs shadow-sm">
                                2
                              </span>
                              District Review
                            </h4>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold">
                              {districtReview.length}
                            </span>
                          </div>

                          {(profile?.role === "superadmin" ||
                            profile?.role === "district") && (
                            <Link
                              to="/baptism/interviews"
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <ClipboardList size={14} />
                              Open Interview Portal
                            </Link>
                          )}
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 min-h-[200px]">
                          {districtReview.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group relative"
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <p className="font-bold text-sm text-slate-900 leading-tight">
                                    {c.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    Branch:{" "}
                                    <span className="text-slate-700 font-semibold">
                                      {c.branch || c.branchId}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {districtReview.length === 0 && (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phase 3: Final HQ Review */}
                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col shrink-0 w-[85vw] sm:w-[320px] xl:w-auto snap-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-400 rounded-t-2xl"></div>
                        <div className="mb-5 border-b border-slate-200/60 pb-3 mt-1">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded bg-white border border-purple-200 text-purple-600 text-xs shadow-sm">
                                3
                              </span>
                              HQ Final Review
                            </h4>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-bold">
                              {hqReview.length}
                            </span>
                          </div>

                          {profile?.role === "superadmin" && (
                            <Link
                              to="/baptism/interviews"
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <ClipboardList size={14} />
                              Open HQ Interview Portal
                            </Link>
                          )}
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 min-h-[200px]">
                          {hqReview.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group relative"
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <p className="font-bold text-sm text-slate-900 leading-tight">
                                    {c.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    Dist:{" "}
                                    <span className="text-slate-700 font-semibold">
                                      {districtNames[c.districtId] ||
                                        c.districtId}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              {profile?.role === "superadmin" &&
                                selectedProgram.status !== "Completed" && (
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          c.refPath,
                                          "Approved",
                                        )
                                      }
                                      className="w-full py-2 bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-xs font-bold rounded-lg transition-all"
                                    >
                                      Approve & Baptize
                                    </button>
                                  </div>
                                )}
                            </div>
                          ))}
                          {hqReview.length === 0 && (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phase 4: Enrolled & Baptised */}
                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col shrink-0 w-[85vw] sm:w-[320px] xl:w-auto snap-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 rounded-t-2xl"></div>
                        <div className="mb-5 flex items-center justify-between border-b border-slate-200/60 pb-3 mt-1">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-white border border-emerald-200 text-emerald-600 text-xs shadow-sm">
                              4
                            </span>
                            Baptised
                          </h4>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold">
                            {approved.length}
                          </span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 min-h-[200px]">
                          {approved.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group"
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                              <div className="relative z-10 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-900">
                                    {c.fullName}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle2
                                      size={12}
                                      className="text-emerald-500"
                                    />
                                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">
                                      Disciple Mode
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {approved.length === 0 && (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Enroll Modal for Branches */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 uppercase">
                Enroll Candidates
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select willing Converts & First-Timers for the{" "}
                {selectedProgram?.title} foundation class.
              </p>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search unbaptised members..."
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-blue-500 outline-none"
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {filteredEligible.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 font-bold">
                      No eligible candidates.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Make sure you have Converts or Visitors who are not
                      baptised.
                    </p>
                  </div>
                ) : (
                  filteredEligible.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-blue-600"
                        checked={selectedToEnroll.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedToEnroll([
                              ...selectedToEnroll,
                              member.id,
                            ]);
                          else
                            setSelectedToEnroll(
                              selectedToEnroll.filter((id) => id !== member.id),
                            );
                        }}
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900">
                          {member.fullName}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          {member.level} • {member.phone}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl px-6"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollSelected}
                disabled={selectedToEnroll.length === 0 || enrolling}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {enrolling && <Loader2 size={16} className="animate-spin" />}
                Enroll {selectedToEnroll.length} Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
