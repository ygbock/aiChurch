import React, { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Sparkles, Camera, Phone, Mail, MapPin, Building2, User, Loader2, RotateCcw, Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const convertSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(7, 'Invalid phone number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female']),
  community: z.string().min(1, 'Community is required'),
  area: z.string().min(1, 'Area is required'),
  branchId: z.string().min(1, 'Branch is required'),
  photoUrl: z.string().default(''),
});

export type ConvertFormData = z.infer<typeof convertSchema>;

interface ConvertFormProps {
  convert?: Partial<ConvertFormData & { id?: string }>;
  branches: { id: string; name: string }[];
  onSubmit: (data: ConvertFormData) => void;
  onCancel: () => void;
  isSaving?: boolean;
  role: string;
}

export const ConvertForm: React.FC<ConvertFormProps> = ({
  convert,
  branches,
  onSubmit,
  onCancel,
  isSaving = false,
  role,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const form = useForm<ConvertFormData>({
    resolver: zodResolver(convertSchema) as any,
    defaultValues: {
      fullName: convert?.fullName || '',
      email: convert?.email || '',
      phone: convert?.phone || '',
      dateOfBirth: convert?.dateOfBirth || '',
      gender: convert?.gender || 'Male',
      community: convert?.community || '',
      area: convert?.area || '',
      branchId: convert?.branchId || '',
      photoUrl: convert?.photoUrl || '',
    },
  });

  useEffect(() => {
    if (!form.getValues('branchId') && branches.length > 0) {
      form.setValue('branchId', branches[0].id);
    }
  }, [branches, form]);

  const startCamera = async (facingMode = cameraFacingMode) => {
    try {
      if (showCamera) stopCamera();

      setShowCamera(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied:", err);
      toast.error("Could not access camera. Please check permissions.");
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

  const handleSubmit = (data: ConvertFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-12"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* Photo Acquisition Block */}
            <div className="lg:w-1/3 xl:w-1/4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Photo Identification</Label>
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
                    <img src={form.watch('photoUrl')} alt="Convert" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8 text-slate-200">
                      <User size={64} className="mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-tight opacity-40">No Photo Selected</p>
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
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Photo documentation is required for new convert registration.</p>
                 </div>
              </div>
            </div>

            <div className="flex-1 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Personal Information</h3>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Legal Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Enter full name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-lg font-bold" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="Male" className="font-bold">Male</SelectItem>
                              <SelectItem value="Female" className="font-bold">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Phone className="h-3 w-3" /> Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Mobile number" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Mail className="h-3 w-3" /> Email Address
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Territory Block */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Location Details</h3>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="community"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <MapPin className="h-3 w-3" /> Community *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Home community" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium" />
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
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <Building2 className="h-3 w-3" /> Area *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Residential area" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign Branch *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} disabled={role !== 'superadmin' && role !== 'district'}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium">
                                <SelectValue placeholder="Select Branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl">
                              {branches.map((branch) => (
                                <SelectItem
                                  key={branch.id}
                                  value={branch.id}
                                  className="font-medium text-sm py-3"
                                >
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pt-10 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 h-12 sm:h-14 px-10 rounded-2xl transition-all"
            >
              Cancel
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest h-12 sm:h-14 px-8 sm:px-12 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 sm:gap-3 group disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {convert && convert.id ? 'Save Changes' : 'Initialize Record'}
              </Button>
            </div>
          </div>
        </motion.div>
      </form>
    </Form>
  );
};
