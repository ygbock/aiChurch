import React, { useState, useEffect } from "react";
import { useFirebase } from "../components/FirebaseProvider";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  collectionGroup,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ClipboardList,
  PenTool,
  Flame,
  ShieldAlert,
  Award,
  Star,
  BookOpen,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Modal from "../components/Modal";

export default function BaptismInterviewPanel() {
  const { profile } = useFirebase();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const [candidateSearch, setCandidateSearch] = useState("");

  // Grading state
  const [doctrineScore, setDoctrineScore] = useState(5);
  const [testimonyScore, setTestimonyScore] = useState(5);
  const [readinessScore, setReadinessScore] = useState(5);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeStation, setActiveStation] = useState<string>("All");

  // Panel Management
  const [isManagePanelOpen, setIsManagePanelOpen] = useState(false);
  const [districtStaff, setDistrictStaff] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"district" | "hq">("district");

  useEffect(() => {
    if (profile?.role === "superadmin") {
      setActiveTab("hq");
    }
  }, [profile]);

  useEffect(() => {
    // Load baptism programs
    const q = query(
      collection(db, "baptismPrograms"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrograms(data);
      if (data.length > 0 && !selectedProgram) setSelectedProgram(data[0]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedProgram) return;
    setLoadingCandidates(true);

    // We want candidates assigned to this program whose status is "Submitted to District", "Submitted to HQ", "Approved"
    // To avoid too many indexes, we just query by season ID and filter in memory if needed, or query by "District" if profile acts restricted
    let q;
    if (profile?.role === "superadmin") {
      q = query(
        collectionGroup(db, "members"),
        where("baptismSeasonId", "==", selectedProgram.id),
      );
    } else {
      q = query(
        collectionGroup(db, "members"),
        where("baptismSeasonId", "==", selectedProgram.id),
        where("districtId", "==", profile?.districtId || "null"),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allCandidates = snapshot.docs.map((doc) => ({
        id: doc.id,
        refPath: doc.ref.path,
        ...doc.data(),
      }));
      // Filter those who are at the interview stage or beyond
      const relevant = allCandidates.filter((c) =>
        ["Submitted to District", "Submitted to HQ", "Approved"].includes(
          c.baptismStatus,
        ),
      );
      setCandidates(relevant);
      setLoadingCandidates(false);
    });

    return () => unsubscribe();
  }, [selectedProgram, profile]);

  const handleSelectCandidate = (c: any) => {
    setSelectedCandidate(c);
    setDoctrineScore(c.interviewScores?.doctrine || 5);
    setTestimonyScore(c.interviewScores?.testimony || 5);
    setReadinessScore(c.interviewScores?.readiness || 5);
    setRemarks(c.interviewRemarks || "");
  };

  useEffect(() => {
    if (!isManagePanelOpen) return;

    let staffQuery;
    if (profile?.role === "superadmin") {
      staffQuery = query(
        collectionGroup(db, "members"),
        where("level", "in", ["Leader", "Worker", "Admin"]),
      );
    } else {
      staffQuery = query(
        collectionGroup(db, "members"),
        where("districtId", "==", profile?.districtId || "null"),
        where("level", "in", ["Leader", "Worker", "Admin"]),
      );
    }

    const us = onSnapshot(staffQuery, (snapshot) => {
      setDistrictStaff(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          refPath: doc.ref.path,
          ...doc.data(),
        })),
      );
    });
    return () => us();
  }, [isManagePanelOpen, profile]);

  const toggleInterviewer = async (member: any) => {
    try {
      await updateDoc(doc(db, member.refPath), {
        isBaptismInterviewer: !member.isBaptismInterviewer,
      });
      toast.success(
        `${member.fullName} ${!member.isBaptismInterviewer ? "assigned as" : "removed from"} interviewer.`,
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to update role");
    }
  };

  const submitInterviewResult = async (action: "Pass" | "Fail") => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    try {
      const totalScore = doctrineScore + testimonyScore + readinessScore;

      let newStatus = "";
      if (activeTab === "district") {
        newStatus =
          action === "Pass" ? "Submitted to HQ" : "In Foundation Class";
      } else {
        newStatus = action === "Pass" ? "Approved" : "Submitted to District";
      }

      const updates: any = {
        baptismStatus: newStatus,
        interviewScores: {
          doctrine: doctrineScore,
          testimony: testimonyScore,
          readiness: readinessScore,
          total: totalScore,
        },
        interviewRemarks: remarks,
        interviewedAt: serverTimestamp(),
        interviewedBy: profile?.uid,
      };

      if (activeTab === "hq" && action === "Pass") {
        updates.isBaptised = true;
        updates.level = "Disciple";
        updates.baptismDate = new Date().toISOString();
        updates.hqApprovedAt = serverTimestamp();
        updates.hqApprovedBy = profile?.uid;
      }

      await updateDoc(doc(db, selectedCandidate.refPath), updates);

      toast.success(`Candidate updated successfully to ${newStatus}`);
      setSelectedCandidate(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit result");
    }
    setIsSubmitting(false);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!c.fullName?.toLowerCase().includes(candidateSearch.toLowerCase()))
      return false;
    if (activeStation !== "All" && c.interviewStation !== activeStation)
      return false;
    return true;
  });

  const pendingCandidates = filteredCandidates.filter((c) =>
    activeTab === "district"
      ? c.baptismStatus === "Submitted to District"
      : c.baptismStatus === "Submitted to HQ",
  );
  const completedCandidates = filteredCandidates.filter((c) =>
    activeTab === "district"
      ? ["Submitted to HQ", "Approved", "Baptised"].includes(c.baptismStatus)
      : ["Approved", "Baptised"].includes(c.baptismStatus),
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Link
            to="/baptism"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Interview Panel Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Grade and review pending baptism candidates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-[200px]">
          {(profile?.role === "superadmin" || profile?.role === "district") && (
            <button
              onClick={() => setIsManagePanelOpen(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Manage Panel Interviewers"
            >
              <Settings size={20} />
            </button>
          )}
          <select
            value={selectedProgram?.id || ""}
            onChange={(e) =>
              setSelectedProgram(programs.find((p) => p.id === e.target.value))
            }
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {profile?.role === "superadmin" && (
        <div className="flex border-b border-slate-200 mb-6 shrink-0">
          <button
            onClick={() => {
              setActiveTab("district");
              setSelectedCandidate(null);
            }}
            className={`px-6 py-3 font-bold text-sm tracking-tight border-b-2 transition-colors ${
              activeTab === "district"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            District Review
          </button>
          <button
            onClick={() => {
              setActiveTab("hq");
              setSelectedCandidate(null);
            }}
            className={`px-6 py-3 font-bold text-sm tracking-tight border-b-2 transition-colors ${
              activeTab === "hq"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            HQ Final Review
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Candidates List (Sidebar) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search candidates..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            <div className="px-2 mb-2">
              <select
                value={activeStation}
                onChange={(e) => setActiveStation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Stations</option>
                <option value="">Unassigned</option>
                {(selectedProgram?.stations || []).map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                <span>Pending Interview</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                  {pendingCandidates.length}
                </span>
              </h4>
              <div className="space-y-1.5">
                {pendingCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCandidate(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedCandidate?.id === c.id
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-800">
                      {c.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-medium flex items-center gap-1">
                      {c.branch || c.branchId}
                      {c.interviewStation && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-600 font-bold">
                            {c.interviewStation}
                          </span>
                        </>
                      )}
                    </p>
                  </button>
                ))}
                {pendingCandidates.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No pending candidates.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                <span>Completed</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                  {completedCandidates.length}
                </span>
              </h4>
              <div className="space-y-1.5">
                {completedCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCandidate(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedCandidate?.id === c.id
                        ? "bg-emerald-50 border-emerald-200 shadow-sm"
                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {c.fullName}
                        </p>
                        <p className="text-[10px] text-emerald-600 uppercase mt-0.5 font-bold">
                          Passed • {c.interviewScores?.total || "-"} pts
                        </p>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interview Panel Form */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0 relative">
          {selectedCandidate ? (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Candidate Info Banner */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedCandidate.fullName}
                  </h2>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-4">
                      <p className="text-sm text-slate-500">
                        <span className="text-slate-400 font-medium">
                          Branch:
                        </span>{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedCandidate.branch ||
                            selectedCandidate.branchId}
                        </span>
                      </p>
                      <p className="text-sm text-slate-500">
                        <span className="text-slate-400 font-medium">
                          Level:
                        </span>{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedCandidate.level}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 font-medium">
                        Station/Panel:
                      </span>
                      <select
                        value={selectedCandidate.interviewStation || ""}
                        onChange={async (e) => {
                          const val = e.target.value;
                          await updateDoc(doc(db, selectedCandidate.refPath), {
                            interviewStation: val || null,
                          });
                          setSelectedCandidate({
                            ...selectedCandidate,
                            interviewStation: val || null,
                          });
                        }}
                        disabled={
                          activeTab === "district"
                            ? selectedCandidate.baptismStatus !==
                              "Submitted to District"
                            : selectedCandidate.baptismStatus !==
                              "Submitted to HQ"
                        }
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {(selectedProgram?.stations || []).map((s: string) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {selectedCandidate.baptismStatus !==
                  "Submitted to District" && (
                  <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Interview Completed
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <div className="p-6 flex-1 max-w-3xl">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                  <ClipboardList className="text-blue-500" />
                  Interview Assessment
                </h3>

                <div className="space-y-8">
                  {/* Criterion 1 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <BookOpen size={16} className="text-indigo-500" />{" "}
                          Doctrine Knowledge
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Understanding of foundational church tenets and
                          salvation.
                        </p>
                      </div>
                      <span className="font-black text-2xl text-indigo-600">
                        {doctrineScore}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={doctrineScore}
                      onChange={(e) =>
                        setDoctrineScore(parseInt(e.target.value))
                      }
                      className="w-full accent-indigo-600"
                      disabled={
                        activeTab === "district"
                          ? selectedCandidate.baptismStatus !==
                            "Submitted to District"
                          : selectedCandidate.baptismStatus !==
                            "Submitted to HQ"
                      }
                    />
                  </div>

                  {/* Criterion 2 */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Flame size={16} className="text-orange-500" />{" "}
                          Personal Testimony
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Clarity and sincerity of their conversion experience.
                        </p>
                      </div>
                      <span className="font-black text-2xl text-orange-600">
                        {testimonyScore}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={testimonyScore}
                      onChange={(e) =>
                        setTestimonyScore(parseInt(e.target.value))
                      }
                      className="w-full accent-orange-600"
                      disabled={
                        activeTab === "district"
                          ? selectedCandidate.baptismStatus !==
                            "Submitted to District"
                          : selectedCandidate.baptismStatus !==
                            "Submitted to HQ"
                      }
                    />
                  </div>

                  {/* Criterion 3 */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <ShieldAlert size={16} className="text-emerald-500" />{" "}
                          Readiness for Discipleship
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Commitment to church rules, tithing, and holy living.
                        </p>
                      </div>
                      <span className="font-black text-2xl text-emerald-600">
                        {readinessScore}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={readinessScore}
                      onChange={(e) =>
                        setReadinessScore(parseInt(e.target.value))
                      }
                      className="w-full accent-emerald-600"
                      disabled={
                        activeTab === "district"
                          ? selectedCandidate.baptismStatus !==
                            "Submitted to District"
                          : selectedCandidate.baptismStatus !==
                            "Submitted to HQ"
                      }
                    />
                  </div>

                  {/* Remarks */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
                      <PenTool size={16} className="text-slate-400" />
                      Interviewer Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter detailed notes and remarks from the panel..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[120px]"
                      disabled={
                        activeTab === "district"
                          ? selectedCandidate.baptismStatus !==
                            "Submitted to District"
                          : selectedCandidate.baptismStatus !==
                            "Submitted to HQ"
                      }
                    />
                  </div>
                </div>

                {/* Total Score & Actions */}
                {((activeTab === "district" &&
                  selectedCandidate.baptismStatus ===
                    "Submitted to District") ||
                  (activeTab === "hq" &&
                    selectedCandidate.baptismStatus === "Submitted to HQ")) && (
                  <div className="mt-8 pt-8 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center">
                        <span className="text-2xl font-black leading-none">
                          {doctrineScore + testimonyScore + readinessScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Total
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500 max-w-[200px] leading-tight">
                        Total aggregate score from all criteria
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => submitInterviewResult("Fail")}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <XCircle size={18} /> Require Retake
                      </button>
                      <button
                        onClick={() => submitInterviewResult("Pass")}
                        disabled={isSubmitting}
                        className={`px-6 py-3 font-bold text-sm rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 text-white ${
                          activeTab === "hq"
                            ? "bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/20"
                            : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                        }`}
                      >
                        <Award size={18} />{" "}
                        {activeTab === "hq"
                          ? "Approve & Baptize"
                          : "Pass & Sync to HQ"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                <Users size={32} className="text-blue-500/50" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">
                Select a Candidate
              </h3>
              <p className="text-sm text-slate-500 max-w-sm text-center mt-2">
                Choose a candidate from the pending list to begin their
                interview evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isManagePanelOpen}
        onClose={() => setIsManagePanelOpen(false)}
        title="Manage Interview Panel"
      >
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Assign leaders and workers as interviewers, and optionally define
            multiple stations/panels.
          </p>

          <div className="mb-6">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-3">
              <ClipboardList size={16} className="text-blue-500" />
              Interview Stations
            </h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="New Station Name (e.g. Panel A)"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                onKeyDown={async (e) => {
                  if (
                    e.key === "Enter" &&
                    e.currentTarget.value.trim() !== ""
                  ) {
                    const newStation = e.currentTarget.value.trim();
                    const currentStations = selectedProgram?.stations || [];
                    if (
                      !currentStations.includes(newStation) &&
                      selectedProgram
                    ) {
                      await updateDoc(
                        doc(db, "baptismPrograms", selectedProgram.id),
                        {
                          stations: [...currentStations, newStation],
                        },
                      );
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  if (input.value.trim() !== "") {
                    const newStation = input.value.trim();
                    const currentStations = selectedProgram?.stations || [];
                    if (
                      !currentStations.includes(newStation) &&
                      selectedProgram
                    ) {
                      updateDoc(
                        doc(db, "baptismPrograms", selectedProgram.id),
                        {
                          stations: [...currentStations, newStation],
                        },
                      );
                      input.value = "";
                    }
                  }
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(selectedProgram?.stations || []).map((station: string) => (
                <div
                  key={station}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  {station}
                  <button
                    onClick={() => {
                      if (selectedProgram) {
                        updateDoc(
                          doc(db, "baptismPrograms", selectedProgram.id),
                          {
                            stations: selectedProgram.stations.filter(
                              (s: string) => s !== station,
                            ),
                          },
                        );
                      }
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
              {(!selectedProgram?.stations ||
                selectedProgram.stations.length === 0) && (
                <span className="text-xs text-slate-400">
                  No custom stations created.
                </span>
              )}
            </div>
          </div>

          <h4 className="font-bold text-sm text-slate-800 mb-3 border-t border-slate-100 pt-6">
            Assign Interviewers
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {districtStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    {staff.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {staff.branch || staff.branchId} • {staff.level}
                  </p>
                </div>
                <button
                  onClick={() => toggleInterviewer(staff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    staff.isBaptismInterviewer
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {staff.isBaptismInterviewer ? "Interviewer" : "Assign"}
                </button>
              </div>
            ))}
            {districtStaff.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No eligible staff found in the district.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
