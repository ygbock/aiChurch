import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { 
  User, 
  Plus, 
  Trash2, 
  Shield, 
  Key, 
  FileText, 
  Sparkles,
  Loader2,
  CheckCircle2,
  Upload,
  ChevronLeft,
  ArrowRight,
  Camera,
  RotateCcw,
  Check,
  Building2,
  Lock,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { cn } from '../lib/utils';

// Firebase
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { useRole } from '../components/Layout';

// Zod Schema based on user snippet
interface ChildData {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  notes: string;
}

interface MemberFormData {
  fullName: string;
  photoUrl: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced';
  spouseName: string;
  numberOfChildren: number;
  children: ChildData[];
  email: string;
  phone: string;
  community: string;
  area: string;
  street: string;
  publicLandmark: string;
  branchId: string;
  membershipLevel: 'baptized' | 'convert' | 'visitor';
  baptizedSubLevel?: 'leader' | 'worker' | 'disciple';
  leaderRole?: 'pastor' | 'assistant_pastor' | 'department_head' | 'ministry_head';
  baptismDate: string;
  joinDate: string;
  baptismOfficiator: string;
  spiritualMentor: string;
  assignedDepartment: string;
  status: 'active' | 'inactive' | 'suspended' | 'transferred';
  prayerNeeds: string;
  pastoralNotes: string;
  createAccount: boolean;
  username: string;
  password: string;
}

const childSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female']),
  notes: z.string(),
});

const memberSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  photoUrl: z.string().default(''),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced']),
  spouseName: z.string(),
  numberOfChildren: z.number().min(0),
  children: z.array(childSchema),
  email: z.string(),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  community: z.string().min(1, 'Community is required'),
  area: z.string().min(1, 'Area is required'),
  street: z.string().min(1, 'Street is required'),
  publicLandmark: z.string(),
  branchId: z.string().min(1, 'Branch is required'),
  membershipLevel: z.enum(['baptized', 'convert', 'visitor']),
  baptizedSubLevel: z.enum(['leader', 'worker', 'disciple']).optional(),
  leaderRole: z.enum(['pastor', 'assistant_pastor', 'department_head', 'ministry_head']).optional(),
  baptismDate: z.string(),
  joinDate: z.string().min(1, 'Join date is required'),
  baptismOfficiator: z.string(),
  spiritualMentor: z.string(),
  assignedDepartment: z.string(),
  status: z.enum(['active', 'inactive', 'suspended', 'transferred']),
  prayerNeeds: z.string(),
  pastoralNotes: z.string(),
  createAccount: z.boolean(),
  username: z.string(),
  password: z.string(),
});

export default function NewMember() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { memberId } = useParams();
  const districtIdParam = searchParams.get('districtId');
  const branchIdParam = searchParams.get('branchId');
  
  const { profile } = useFirebase();
  const { role } = useRole();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showChildDialog, setShowChildDialog] = useState(false);
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [tempChild, setTempChild] = useState<Omit<ChildData, 'id'>>({ name: '', dateOfBirth: '', gender: 'male', notes: '' });
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = async (facingMode = cameraFacingMode) => {
    try {
      if (showCamera) stopCamera();
      
      setShowCamera(true);
      // Wait for React to render the video element
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied:", err);
      let errorMessage = "Could not access camera.";
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings and try again.";
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      }
      toast.error(errorMessage);
      setShowCamera(false);
    }
  };

  const toggleCamera = async () => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newMode);
    await startCamera(newMode);
  };


  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        form.setValue('photoUrl', dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      fullName: '',
      photoUrl: '',
      dateOfBirth: '',
      gender: 'male',
      maritalStatus: 'single',
      spouseName: '',
      numberOfChildren: 0,
      children: [],
      email: '',
      phone: '',
      community: '',
      area: '',
      street: '',
      publicLandmark: '',
      branchId: branchIdParam || profile?.branchId || '',
      membershipLevel: 'baptized',
      joinDate: new Date().toISOString().split('T')[0],
      baptizedSubLevel: 'disciple',
      leaderRole: 'department_head',
      baptismDate: '',
      baptismOfficiator: '',
      spiritualMentor: '',
      assignedDepartment: '',
      status: 'active',
      prayerNeeds: '',
      pastoralNotes: '',
      createAccount: false,
      username: '',
      password: '',
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'children',
  });

  // Fetch Member Data if in Edit Mode
  useEffect(() => {
    if (memberId && districtIdParam && branchIdParam) {
      const fetchMember = async () => {
        try {
          console.log(`Fetching member: ${memberId} in ${districtIdParam}/${branchIdParam}`);
          const docRef = doc(db, 'districts', districtIdParam, 'branches', branchIdParam, 'members', memberId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Member data fetched:", data);
            
            // Map legacy 'level' to 'membershipLevel' if needed
            let membershipLevel = data.membershipLevel;
            if (!membershipLevel && data.level) {
              const levelMap: Record<string, 'baptized' | 'convert' | 'visitor'> = {
                'Member': 'baptized',
                'Visitor': 'visitor',
                'Convert': 'convert'
              };
              membershipLevel = levelMap[data.level] || 'baptized';
            }

            // Ensure all mandatory fields have at least default values
            const formattedData = {
              ...form.getValues(), // Use defaults for any missing fields
              ...data,
              membershipLevel: membershipLevel || 'baptized',
              children: data.children || [],
              dateOfBirth: data.dateOfBirth || '',
              joinDate: data.joinDate || new Date().toISOString().split('T')[0],
              baptismDate: data.baptismDate || '',
            };

            form.reset(formattedData as any);
          } else {
            console.warn("No such document!");
            toast.error("Member record not found");
            navigate('/members');
          }
        } catch (err) {
          console.error("Failed to fetch member:", err);
          toast.error("Error loading member data");
        }
      };
      fetchMember();
    }
  }, [memberId, districtIdParam, branchIdParam, form, navigate]);

  // Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const districtId = districtIdParam || profile?.districtId;
        if (!districtId) return;
        const snap = await getDocs(collection(db, 'districts', districtId, 'branches'));
        setBranches(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };
    fetchBranches();
  }, [profile?.districtId, districtIdParam]);

  // Fetch Departments when branch changes
  const watchedBranchId = form.watch('branchId');
  useEffect(() => {
    const districtId = districtIdParam || profile?.districtId;
    if (watchedBranchId && districtId) {
      const fetchDepts = async () => {
        try {
          const snap = await getDocs(collection(db, 'districts', districtId, 'branches', watchedBranchId, 'departments'));
          setDepartments(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
        } catch (err) {
          console.error("Failed to fetch departments:", err);
        }
      };
      fetchDepts();
    }
  }, [watchedBranchId, profile?.districtId, districtIdParam]);

  const resolveMinistries = (dob: string, gender: string): string[] => {
    if (!dob) return [];
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    const g = gender.toLowerCase();
    
    if (age < 13) {
      return ['children'];
    } else if (age >= 13 && age <= 34) {
      return ['youth'];
    } else if (age >= 35) {
      return g === 'female' ? ['womens'] : ['mens'];
    }
    return [];
  };

  const onSubmit = async (data: MemberFormData) => {
    setIsSaving(true);
    try {
      const districtId = districtIdParam || profile?.districtId;
      if (!districtId || !data.branchId) throw new Error("Missing district or branch configuration");

      const calculatedMinistries = resolveMinistries(data.dateOfBirth, data.gender as string);

      const memberData = {
        ...data,
        districtId,
        ministries: calculatedMinistries,
        updatedAt: serverTimestamp(),
      };

      if (!memberId) {
        (memberData as any).createdAt = serverTimestamp();
        const path = `districts/${districtId}/branches/${data.branchId}/members`;
        await addDoc(collection(db, path), memberData);
        toast.success('Member identity initialized successfully');
      } else {
        const docRef = doc(db, 'districts', districtId, 'branches', data.branchId, 'members', memberId);
        await updateDoc(docRef, memberData as any);
        toast.success('Member record updated successfully');
      }
      
      setSaveSuccess(true);
    } catch (error) {
      console.error(error);
      toast.error(memberId ? 'Failed to update member record' : 'Failed to create member record');
    } finally {
      setIsSaving(false);
    }
  };

  const watchedMembershipLevel = form.watch('membershipLevel');
  const watchedMaritalStatus = form.watch('maritalStatus');
  const watchedBaptizedSubLevel = form.watch('baptizedSubLevel');
  const watchedCreateAccount = form.watch('createAccount');

  if (saveSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-[2rem]">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {memberId ? 'Update Complete' : 'Onboarding Complete'}
        </h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          The member record has been successfully {memberId ? 'synchronized' : 'created'} with the registry.
        </p>
        <Button onClick={() => navigate('/members')} size="lg" className="px-12 py-6 rounded-2xl font-bold uppercase tracking-widest">
          Return to Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pb-20 px-2 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-6 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-center md:gap-6">
        <div className="space-y-1 w-full">
          <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
             <Building2 size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Repository Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl">
            {memberId ? 'Edit Profile' : 'Member Registration'}
          </h1>
          <p className="max-w-xl font-medium text-slate-500 text-xs sm:text-sm md:text-base">
            {memberId ? 'Updating secure identity records and ecclesiastical profiles.' : 'Initializing secure identity records and ecclesiastical dispersion profiles.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-10 sm:h-12 w-full rounded-[2rem] border-slate-200 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 md:w-auto">
            <ChevronLeft className="mr-2" size={16} /> Back
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSaving}
            className="h-10 sm:h-12 w-full rounded-[2rem] bg-slate-900 px-10 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all gap-3 hover:bg-slate-800 active:scale-95 md:w-auto"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            Commit
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-10">
          {/* Mobile-only Progress Indicator & Desktop Tab Selector */}
          <div className="flex gap-1 overflow-x-auto rounded-[2rem] border border-slate-200 bg-white p-1.5 shadow-sm no-scrollbar">
            {[
              { id: 'personal', icon: <User size={14} />, label: 'Personal' },
              { id: 'church', icon: <Building2 size={14} />, label: 'Church' },
              { id: 'account', icon: <Lock size={14} />, label: 'Access' },
              { id: 'notes', icon: <FileText size={14} />, label: 'Notes' }
            ].map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 min-w-[80px] flex-1 py-3 md:flex-row md:gap-3 md:min-w-[160px] md:py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Floating Navigation (Mobile Only) */}
          <div className="md:hidden fixed bottom-6 left-6 right-6 flex items-center justify-between gap-4 z-50">
            <Button 
               type="button" 
               variant="secondary"
               onClick={() => {
                 const tabs = ['personal', 'church', 'account', 'notes'];
                 const currentIndex = tabs.indexOf(activeTab);
                 if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
               }}
               disabled={activeTab === 'personal'}
               className="rounded-full shadow-2xl px-8"
            >
              Back
            </Button>
            <Button 
               type="button" 
               onClick={() => {
                 const tabs = ['personal', 'church', 'account', 'notes'];
                 const currentIndex = tabs.indexOf(activeTab);
                 if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
               }}
               disabled={activeTab === 'notes'}
               className="rounded-full shadow-2xl px-8 bg-slate-900 text-white"
            >
              Next
            </Button>
          </div>

          <div className="min-h-[500px] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:rounded-[3rem] md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-12"
                >
                  <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    {/* Photo Acquisition Block */}
                    <div className="lg:w-1/3 xl:w-1/4 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identification Matrix</Label>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="relative aspect-square rounded-[3rem] bg-slate-50 border-4 border-slate-100 overflow-hidden shadow-inner group flex items-center justify-center">
                          {showCamera ? (
                            <div className="relative w-full h-full bg-black">
                              <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted
                                className="w-full h-full object-cover" 
                                style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                              />
                              {/* Camera Overlay */}
                              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                <div className="flex justify-between items-center w-full">
                                  <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto"
                                  >
                                    <X size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={toggleCamera}
                                    className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto sm:hidden"
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                </div>
                                <div className="flex justify-center items-center pb-4">
                                  <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                                  >
                                    <div className="w-12 h-12 bg-white rounded-full opacity-80" />
                                  </button>
                                </div>
                              </div>
                              <canvas ref={canvasRef} className="hidden" />
                            </div>
                          ) : form.watch('photoUrl') ? (
                            <img src={form.watch('photoUrl')} alt="Member" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-8 text-slate-200">
                              <User size={64} className="mx-auto mb-4 opacity-10" />
                              <p className="text-[10px] font-black uppercase tracking-widest leading-tight opacity-40">Null Photo Data</p>
                            </div>
                          )}
                          
                          {(form.watch('photoUrl') && !showCamera) && (
                            <button
                              type="button"
                              onClick={() => form.setValue('photoUrl', '')}
                              className="absolute top-6 right-6 bg-white/90 backdrop-blur p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            onClick={() => startCamera()}
                            variant="outline"
                            className="rounded-2xl border-slate-200 gap-2 h-10 sm:h-14 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:border-indigo-600 transition-all group"
                          >
                            <Camera size={16} className="group-hover:text-indigo-600" /> Acquisition
                          </Button>
                          
                          <div className="relative h-10 sm:h-14">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full rounded-2xl border-slate-200 gap-2 h-10 sm:h-14 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:border-emerald-600 transition-all group"
                            >
                              <Upload size={16} className="group-hover:text-emerald-600" /> Upload
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                         <div className="flex gap-4">
                            <Sparkles className="text-indigo-600 flex-shrink-0" size={20} />
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Facade acquisition is essential for neural identity verification protocols.</p>
                         </div>
                      </div>
                    </div>

                    {/* Logic Fields Block */}
                    <div className="flex-1 space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Personal Information</h3>
                           <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter full name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Birth *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maritalStatus"
                            render={({ field }) => (
                              <FormItem className={watchedMaritalStatus === 'married' ? '' : 'md:col-span-2'}>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Status *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                                      <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {watchedMaritalStatus === 'married' && (
                            <FormField
                              control={form.control}
                              name="spouseName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relational Partner</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Spouse full name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Geographic & Sync</h3>
                           <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="email@example.com" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="+1234567890" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="community"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Community *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter community" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="area"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Area / Region *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter area or region" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Street Address *</FormLabel>
                                <FormControl>
                                  <Input placeholder="House No. and Street Name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                           {fields.length}
                         </div>
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kinship Descendants</h3>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingChildIndex(null);
                          setTempChild({ name: '', dateOfBirth: '', gender: 'male', notes: '' });
                          setShowChildDialog(true);
                        }}
                        className="rounded-xl border-slate-200 h-10 px-6 text-[10px] font-black uppercase tracking-widest hover:border-slate-900"
                      >
                        Add Node
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {fields.length === 0 && (
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                           <User className="mx-auto text-slate-200 mb-4 opacity-50" size={32} />
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No descendant records initialized</p>
                        </div>
                      )}
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                          <div className="flex items-center gap-6 mb-4 md:mb-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">
                               {field.gender === 'male' ? 'M' : 'F'}
                            </div>
                            <div className="space-y-1">
                               <h4 className="font-black text-slate-900 uppercase tracking-tight">{field.name || 'Unnamed Record'}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Calendar size={10} /> {field.dateOfBirth || 'Date Pending'}
                               </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => {
                                const current = fields[index] as ChildData;
                                setEditingChildIndex(index);
                                setTempChild({ 
                                  name: current.name, 
                                  dateOfBirth: current.dateOfBirth, 
                                  gender: current.gender,
                                  notes: current.notes
                                });
                                setShowChildDialog(true);
                              }}
                              className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 flex-1 md:flex-none"
                            >
                              Edit
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => remove(index)}
                              className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 flex-1 md:flex-none"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Child Editor Dialog */}
                    <Dialog open={showChildDialog} onOpenChange={setShowChildDialog}>
                      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-[2.5rem] p-6 sm:p-8 border-slate-200 md:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">Kinship Record</DialogTitle>
                          <DialogDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Define biographic parameters for the descendant entity.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 py-6 sm:py-8">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Name</Label>
                            <Input 
                              placeholder="Full Name" 
                              value={tempChild.name}
                              onChange={(e) => setTempChild({ ...tempChild, name: e.target.value })}
                              className="h-12 sm:h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-inner"
                            />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Matrix</Label>
                            <Select 
                              value={tempChild.gender}
                              onValueChange={(val) => setTempChild({ ...tempChild, gender: val as 'male' | 'female' })}
                            >
                              <SelectTrigger className="h-12 sm:h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-inner">
                                <SelectValue placeholder="Vector" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                <SelectItem value="male">Male Vector</SelectItem>
                                <SelectItem value="female">Female Vector</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-4 md:col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporal Origin</Label>
                            <Input 
                              type="date"
                              value={tempChild.dateOfBirth}
                              onChange={(e) => setTempChild({ ...tempChild, dateOfBirth: e.target.value })}
                              className="h-12 sm:h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-inner"
                            />
                          </div>
                        </div>

                        <DialogFooter className="gap-3 mt-2 sm:mt-4 flex-col sm:flex-row">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setShowChildDialog(false)}
                            className="rounded-2xl h-12 sm:h-14 w-full sm:w-auto px-8 text-[10px] font-black uppercase tracking-widest text-slate-500"
                          >
                            Discard
                          </Button>
                          <Button 
                            type="button" 
                            onClick={() => {
                              if (editingChildIndex === null) {
                                append({ id: Date.now().toString(), ...tempChild });
                              } else {
                                form.setValue(`children.${editingChildIndex}`, { id: fields[editingChildIndex].id, ...tempChild });
                              }
                              setShowChildDialog(false);
                            }}
                            className="rounded-2xl h-12 sm:h-14 w-full sm:w-auto px-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 mt-2 sm:mt-0"
                          >
                            Complete Ingestion
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              )}

              {activeTab === 'church' && (
                <motion.div
                  key="church"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-12"
                >
                  <div className="flex flex-col lg:flex-row gap-16">
                    <div className="lg:w-1/3 xl:w-1/4 space-y-6">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ecclesiastical Context</Label>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-8">
                         <div className="space-y-2">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Organization</h4>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Assign the entity to a validated branch and define their membership hierarchy.</p>
                         </div>
                         <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <Building2 size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync Status: Online</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-12">
                      <div className="space-y-8">
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Church Information</h3>
                           <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Branch *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  disabled={!(role === 'superadmin' || role === 'district')}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                                      <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
                                    {branches.map(b => (
                                      <SelectItem key={b.id} value={b.id} className="font-bold">{b.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                                {!(role === 'superadmin' || role === 'district') && (
                                  <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-1">
                                    Defaulted to your assigned branch
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />



                          <FormField
                            control={form.control}
                            name="joinDate"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Membership Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-8 p-10 bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem]">
                          <div className="flex items-center gap-2">
                             <h3 className="text-xl font-bold text-indigo-900 uppercase tracking-tight">Baptism & Department</h3>
                             <div className="h-px flex-1 bg-indigo-100" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                              control={form.control}
                              name="baptizedSubLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Member Classification *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-14 rounded-2xl border-indigo-200 bg-white text-sm font-bold">
                                        <SelectValue placeholder="Select Role" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl">
                                      <SelectItem value="disciple" className="font-bold">Disciple</SelectItem>
                                      <SelectItem value="worker" className="font-bold">Worker</SelectItem>
                                      <SelectItem value="leader" className="font-bold">Leader</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            {watchedBaptizedSubLevel === 'leader' && (
                              <FormField
                                control={form.control}
                                name="leaderRole"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Leadership Role *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-14 rounded-2xl border-indigo-200 bg-white text-sm font-bold">
                                          <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="rounded-2xl">
                                        <SelectItem value="pastor" className="font-bold text-indigo-600">Pastor</SelectItem>
                                        <SelectItem value="assistant_pastor" className="font-bold">Assistant Pastor</SelectItem>
                                        <SelectItem value="department_head" className="font-bold">Department Head</SelectItem>
                                        <SelectItem value="ministry_head" className="font-bold">Ministry Head</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            )}

                            <FormField
                              control={form.control}
                              name="baptismDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Baptism Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} className="h-14 rounded-2xl border-indigo-200 bg-white text-sm font-bold" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="assignedDepartment"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Department Assignment</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-14 rounded-2xl border-indigo-200 bg-white text-sm font-bold">
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl">
                                      <SelectItem value="_none">None</SelectItem>
                                      {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-12"
                >
                  {watchedMembershipLevel !== 'baptized' ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem]">
                      <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-8">
                        <Lock size={48} />
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Access Restricted</h4>
                      <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">Network portal access is reserved for validated Baptized entities. Elevate membership status to proceed with credential initialization.</p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Credentials</h3>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>

                      <FormField
                        control={form.control}
                        name="createAccount"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-6 space-y-0 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl">
                            <FormControl>
                              <div className="flex items-center transition-transform active:scale-95">
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                  className="w-8 h-8 rounded-xl border-white/20 bg-white/10 text-indigo-500 focus:ring-white/20"
                                />
                              </div>
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="text-2xl font-black uppercase tracking-tight cursor-pointer">Initialize Portal Access</FormLabel>
                              <p className="text-sm text-slate-400 font-medium leading-none">Generate secure login parameters for the ecclesiastical portal.</p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {watchedCreateAccount && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 border border-slate-100 rounded-[3rem] animate-in fade-in slide-in-from-top-6 duration-500 bg-slate-50/50">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                  <User size={12} /> Username Matrix
                                </FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="identity@registry.com" {...field} className="h-14 rounded-2xl border-slate-200 bg-white text-sm font-bold shadow-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                  <Lock size={12} /> Access Passphrase
                                </FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="System generated or manual" {...field} className="h-14 rounded-2xl border-slate-200 bg-white text-sm font-bold shadow-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-12"
                >
                  <div className="space-y-10">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Qualitative Analysis</h3>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FormField
                        control={form.control}
                        name="prayerNeeds"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prayer Requests & Needs</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detail specific prayer needs or requests..." 
                                className="min-h-[220px] rounded-[2rem] border-slate-200 p-8 text-sm font-medium bg-slate-50 focus:bg-white transition-all shadow-inner" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pastoralNotes"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confidential Pastoral Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Confidential observations or records..." 
                                className="min-h-[220px] rounded-[2rem] border-rose-100 bg-rose-50/20 p-8 text-sm font-medium focus:bg-white transition-all shadow-inner" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-900/5 gap-4">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">
              Abort Registration
            </Button>
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-slate-900 text-white px-8 sm:px-12 h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 text-[10px] sm:text-xs">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {memberId ? 'Update Record' : 'Initialize Identity'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
