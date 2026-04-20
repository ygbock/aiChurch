import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { 
  UserPlus, 
  Camera, 
  Lightbulb, 
  User, 
  Phone, 
  History, 
  Network, 
  X, 
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Plus,
  Baby,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Upload,
  Check,
  Building2,
  Loader2,
  Save
} from 'lucide-react';
import { useRole } from '../components/Layout';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, collectionGroup, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface Child {
  id: string;
  name: string;
  dob: string;
  gender: string;
}

export default function NewMember() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { role } = useRole();
  const { profile, memberProfile: currentMember } = useFirebase();
  const [step, setStep] = useState(1);
  const [isEdit, setIsEdit] = useState(false);
  const [targetMemberPath, setTargetMemberPath] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [children, setChildren] = useState<Child[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const appendParams = (path: string) => path;

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    branch: '',
    isBaptised: false,
    level: 'Convert',
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    async function loadMember() {
      if (!memberId) return;
      setIsEdit(true);
      
      try {
        let memberData: any = null;
        let path: string | null = null;

        // If it's the current user's profile, we might have it already
        if (currentMember && currentMember.id === memberId) {
          memberData = currentMember;
          path = `districts/${currentMember.districtId}/branches/${currentMember.branchId}/members/${memberId}`;
        } else {
          // Find member by ID using collectionGroup
          const q = query(collectionGroup(db, 'members'), where('__name__', '==', memberId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            memberData = snap.docs[0].data();
            // Infer path from parent references
            const ref = snap.docs[0].ref;
            path = ref.path;
          }
        }

        if (memberData) {
          setFormData({
            fullName: memberData.fullName || '',
            dob: memberData.dob || '',
            gender: memberData.gender || '',
            phone: memberData.phone || '',
            email: memberData.email || '',
            address: memberData.address || '',
            emergencyContact: memberData.emergencyContact || '',
            branch: memberData.branchId || '',
            isBaptised: memberData.isBaptised || false,
            level: memberData.level || 'Convert',
            username: memberData.username || '',
            password: '',
            confirmPassword: ''
          });
          setMaritalStatus(memberData.maritalStatus || 'Single');
          if (memberData.children) {
            setChildren(memberData.children.map((c: any) => ({ ...c, id: Math.random().toString(36).substr(2, 9) })));
          }
          if (memberData.photoUrl) {
            setPreview(memberData.photoUrl);
          }
          setTargetMemberPath(path);
        }
      } catch (err) {
        console.error("Failed to load member for edit:", err);
      }
    }
    loadMember();
  }, [memberId, currentMember]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    multiple: false
  } as any);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      if (!image || !croppedAreaPixels) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      canvas.width = (croppedAreaPixels as any).width;
      canvas.height = (croppedAreaPixels as any).height;

      ctx.drawImage(
        img,
        (croppedAreaPixels as any).x,
        (croppedAreaPixels as any).y,
        (croppedAreaPixels as any).width,
        (croppedAreaPixels as any).height,
        0,
        0,
        (croppedAreaPixels as any).width,
        (croppedAreaPixels as any).height
      );

      const croppedImage = canvas.toDataURL('image/jpeg');
      setPreview(croppedImage);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      // Fallback
      setPreview(image);
      setIsCropping(false);
    }
  };

  const addChild = () => {
    setChildren([...children, { id: Math.random().toString(36).substr(2, 9), name: '', dob: '', gender: '' }]);
  };

  const removeChild = (id: string) => {
    setChildren(children.filter(c => c.id !== id));
  };

  const updateChild = (id: string, field: keyof Child, value: string) => {
    setChildren(children.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.fullName) newErrors.fullName = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
      if (!formData.gender || formData.gender === 'Select Gender') newErrors.gender = 'Gender is required';
    } else if (currentStep === 2) {
      if (!formData.phone) newErrors.phone = 'Phone Number is required';
      if (!formData.email) {
        newErrors.email = 'Email Address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    } else if (currentStep === 3) {
      if (!formData.branch) newErrors.branch = 'Branch assignment is required';
    } else if (currentStep === 5) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const goToStep = (s: number) => {
    // Only allow jumping back or to the next immediate step if valid
    if (s < step) {
      setStep(s);
    } else if (s === step + 1) {
      nextStep();
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const progress = (step / 6) * 100;

  const resetForm = () => {
    setFormData({
      fullName: '',
      dob: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      branch: role === 'admin' ? 'Main Campus' : '',
      isBaptised: false,
      level: 'Convert',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setChildren([]);
    setPreview(null);
    setImage(null);
    setStep(1);
    setErrors({});
    setMaritalStatus('Single');
  };

  const handleSaveMember = async (shouldNavigate = true) => {
    if (step < 5 && !isEdit) {
      nextStep();
      return;
    }
    
    if (step === 5 && !validateStep(5) && !isEdit) return;

    setIsSaving(true);
    try {
      const districtId = profile?.districtId || (isEdit && targetMemberPath ? targetMemberPath.split('/')[1] : 'default-district');
      const branchId = formData.branch || profile?.branchId || (isEdit && targetMemberPath ? targetMemberPath.split('/')[3] : 'default-branch');
      
      const memberData: any = {
        fullName: formData.fullName,
        branchId: branchId,
        districtId: districtId,
        level: formData.level,
        status: isEdit ? (currentMember?.status || 'Active') : 'Active',
        dob: formData.dob || null,
        gender: formData.gender,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        emergencyContact: formData.emergencyContact || null,
        isBaptised: formData.isBaptised,
        username: formData.username || null,
        maritalStatus,
        children: children.map(c => ({ name: c.name, dob: c.dob, gender: c.gender })),
        photoUrl: preview || '',
        updatedAt: serverTimestamp(),
        isProfileComplete: true
      };

      if (!isEdit) {
        memberData.createdAt = serverTimestamp();
        const path = `/districts/${districtId}/branches/${branchId}/members`;
        await addDoc(collection(db, path), memberData);
      } else if (targetMemberPath) {
        await updateDoc(doc(db, targetMemberPath), memberData);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (shouldNavigate) {
        navigate(appendParams('/members/registry'));
      } else {
        resetForm();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'members');
    } finally {
      setIsSaving(false);
    }
  };

  if (saveSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Registration Successful</h2>
        <p className="text-slate-500 mb-8 max-w-sm">The member has been officially added to the database and assigned to the branch.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(appendParams('/members/registry'))}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
          >
            Go to Registry
          </button>
          <button 
            onClick={() => setSaveSuccess(false)}
            className="px-8 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-12"
    >
      {/* Progress Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <button 
            onClick={() => navigate(appendParams('/members/registry'))}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 mb-6 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={14} />
            Back to Registry
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <UserPlus size={24} />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tighter text-slate-900 uppercase">New Member</h2>
          </div>
          <p className="text-slate-500 max-w-md font-medium text-sm">Official registration portal. Data captured here will be used for pastoral oversight and ministry growth analytics.</p>
        </div>

        <div className="w-full md:w-auto">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <button
                key={s}
                onClick={() => goToStep(s)}
                className={`h-2 rounded-full transition-all flex-1 md:w-8 ${
                  step === s ? 'bg-blue-600 w-12' : (step > s ? 'bg-emerald-500' : 'bg-slate-200')
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between md:justify-end items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration Pipeline</span>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-lg border border-blue-100">STEP {step} / 6</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Sidebar: Identification & Status */}
        <div className="lg:col-span-3 space-y-6">
          {/* Passport Photo Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
            <div 
              {...getRootProps()}
              className={`w-28 h-36 mx-auto rounded-xl flex flex-col items-center justify-center border-2 border-dashed mb-4 group transition-all cursor-pointer overflow-hidden relative ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={28} className={`mb-2 transition-colors ${isDragActive ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-500'}`} />
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${isDragActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`}>
                    {isDragActive ? 'Drop here' : 'Upload Photo'}
                  </p>
                </>
              )}
              {preview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-[9px] font-bold uppercase">Change</p>
                </div>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Member Portrait</h3>
            <p className="text-[10px] text-slate-500 leading-tight">Required for identification. (Max 2MB)</p>
          </div>

          {/* Info Tip Card */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white overflow-hidden relative shadow-xl">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
            <Lightbulb className="text-blue-400 mb-4" size={24} />
            <h4 className="font-bold text-lg mb-2">Privacy Assurance</h4>
            <p className="text-sm text-slate-400 leading-relaxed">Member data is encrypted and strictly used for internal ministry outreach and pastoral care only.</p>
          </div>
        </div>

        {/* Main Form Sections */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="John Doe" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 ${
                        errors.fullName ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Date of Birth *</label>
                    <input 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                        errors.dob ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.dob && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender *</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${
                        errors.gender ? 'border-red-500' : 'border-slate-200'
                      }`}
                    >
                      <option>Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.gender}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Marital Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['Single', 'Married', 'Divorced', 'Widowed'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMaritalStatus(status)}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
                            maritalStatus === status 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Children Section */}
                  <div className="col-span-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <Baby size={18} className="text-slate-400" />
                        <h4 className="text-sm font-bold text-slate-900">Children Information</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={addChild}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Child
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {children.map((child, index) => (
                        <motion.div 
                          key={child.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl relative group"
                        >
                          <button 
                            onClick={() => removeChild(child.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Child's Name</label>
                            <input 
                              type="text" 
                              value={child.name}
                              onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                              placeholder="Child Name"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</label>
                            <input 
                              type="date" 
                              value={child.dob}
                              onChange={(e) => updateChild(child.id, 'dob', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                            <select 
                              value={child.gender}
                              onChange={(e) => updateChild(child.id, 'gender', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                            >
                              <option>Select</option>
                              <option>Male</option>
                              <option>Female</option>
                            </select>
                          </div>
                        </motion.div>
                      ))}
                      {children.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">No children added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Phone size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Contact Details</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                        errors.phone ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address *</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Residential Address</label>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Faith Avenue, Grace City..." 
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Emergency Contact (Name & Phone)</label>
                    <input 
                      type="text" 
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      placeholder="Jane Doe - +1 (555) 111-2222" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <History size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Church History</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign Branch *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        disabled={role === 'admin'}
                        value={formData.branch}
                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                        className={`w-full bg-slate-50 border rounded-xl p-3 pl-10 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-500 ${
                          errors.branch ? 'border-red-500' : 'border-slate-200'
                        }`}
                      >
                        <option value="">Select Branch</option>
                        {role === 'admin' ? (
                          <option value="Main Campus">Main Campus (Your Branch)</option>
                        ) : role === 'district' ? (
                          <>
                            <option value="Central Cathedral">Central Cathedral</option>
                            <option value="Eastside Ministry">Eastside Ministry</option>
                            <option value="Grace Chapel">Grace Chapel</option>
                            <option value="North Point">North Point</option>
                          </>
                        ) : (
                          <>
                            <option value="Central Cathedral">Central Cathedral</option>
                            <option value="Eastside Ministry">Eastside Ministry</option>
                            <option value="Grace Chapel">Grace Chapel</option>
                            <option value="North Point">North Point</option>
                            <option value="South Valley">South Valley</option>
                          </>
                        )}
                      </select>
                    </div>
                    {errors.branch && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.branch}</p>}
                    {role === 'admin' && <p className="text-[10px] text-slate-400 mt-1 italic">As a Branch Admin, you can only add members to your assigned branch.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Date Joined</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Previous Church</label>
                    <input 
                      type="text" 
                      placeholder="Bethel Ministry (optional)" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Baptism Status</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="baptised" 
                            checked={formData.isBaptised}
                            onChange={() => setFormData({...formData, isBaptised: true, level: 'Disciple'})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Yes, Baptised</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="baptised" 
                            checked={!formData.isBaptised}
                            onChange={() => setFormData({...formData, isBaptised: false, level: 'Convert'})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Not yet</span>
                        </label>
                      </div>

                      {formData.isBaptised && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 flex-1 w-full sm:w-auto"
                        >
                          <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Level:</label>
                          <select 
                            value={formData.level}
                            onChange={(e) => setFormData({...formData, level: e.target.value})}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          >
                            <option value="Disciple">Disciple</option>
                            <option value="Worker">Worker</option>
                            <option value="Leader">Leader</option>
                          </select>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Network size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Ministry Assignment</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Department</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none">
                      <option>Unassigned</option>
                      <option>Choir</option>
                      <option>Ushering</option>
                      <option>Technical/Media</option>
                      <option>Sunday School Teachers</option>
                      <option>Hospitality</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Ministry Chips</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full flex items-center gap-2 border border-blue-100">
                        New Believer 
                        <button className="hover:text-red-500 transition-colors"><X size={12} /></button>
                      </span>
                      <button className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-full flex items-center gap-2 border border-slate-200 hover:bg-slate-100 transition-colors">
                        + Add Tag
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 5 && (
              <motion.section 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Account Credentials</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Username *</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="johndoe_faith" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                        errors.username ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.username && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.username}</p>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Password *</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-12 ${
                        errors.password ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.password}</p>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm Password *</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••" 
                      className={`w-full bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-12 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.confirmPassword}</p>}
                  </div>
                </div>
              </motion.section>
            )}
            {step === 6 && (
              <motion.section 
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight text-slate-900">Final Review</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Identity Summary</h4>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {preview ? (
                        <img src={preview} alt="" className="w-16 h-20 rounded-xl object-cover shadow-md" />
                      ) : (
                        <div className="w-16 h-20 bg-slate-200 rounded-xl animate-pulse" />
                      )}
                      <div>
                        <p className="text-lg font-bold text-slate-900 leading-tight">{formData.fullName}</p>
                        <p className="text-sm text-slate-500">{formData.email}</p>
                        <p className="text-[10px] font-mono text-blue-600 mt-1 uppercase">{formData.branchId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Ministry Assignment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium tracking-tight">Access Role</span>
                        <span className="text-slate-900 font-bold uppercase text-[11px] tracking-wide bg-blue-100 px-2 py-0.5 rounded">Standard Member</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium tracking-tight">Status</span>
                        <span className="text-emerald-600 font-bold uppercase text-[11px] tracking-wide">Ready for Provision</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm">Member Credentials</h5>
                    <p className="text-slate-400 text-xs mt-1">Username: <span className="font-mono text-emerald-400">{formData.username}</span></p>
                  </div>
                  <Lock className="text-slate-700" size={32} />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-8 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Previous Step
              </button>
            )}
            
            {step < 6 ? (
              <button 
                onClick={nextStep}
                className="flex-1 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                disabled={isSaving}
                onClick={() => handleSaveMember(true)}
                className="flex-1 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                Complete Registration
              </button>
            )}

            {step === 6 && (
              <button 
                disabled={isSaving}
                onClick={() => handleSaveMember(false)}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Processing...' : 'Save and Add Another'}
              </button>
            )}

            <button 
              onClick={() => navigate(appendParams('/members/registry'))}
              className="px-6 py-4 text-slate-400 font-bold hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Cropping Modal */}
      {isCropping && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl">Crop Member Portrait</h3>
              <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <div className="relative h-96 bg-slate-900">
              <Cropper
                image={image!}
                crop={crop}
                zoom={zoom}
                aspect={3/4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zoom Level</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCropping(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Save Portrait
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
