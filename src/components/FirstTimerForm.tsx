import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import {
  Sparkles,
  User,
  Calendar,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  Navigation,
  MessageSquare,
  Loader2
} from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Label } from './ui/label';
import { FirstTimerData } from '../types/membership';

const firstTimerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7, 'Phone must be at least 7 characters').optional().or(z.literal('')),
  community: z.string().min(1, 'Community is required'),
  area: z.string().min(1, 'Area is required'),
  street: z.string().min(1, 'Street is required'),
  publicLandmark: z.string().optional(),
  serviceDate: z.string().min(1, 'Service date is required'),
  firstVisit: z.string().min(1, 'First visit date is required'),
  invitedBy: z.string().optional(),
  branchId: z.string().min(1, 'Branch is required'),
  status: z.enum(['new', 'contacted', 'followed_up', 'converted']),
  followUpStatus: z.enum(['pending', 'called', 'visited', 'completed']),
  followUpNotes: z.string().optional(),
  notes: z.string().optional(),
});

export type FirstTimerFormData = z.infer<typeof firstTimerSchema>;

interface FirstTimerFormProps {
  firstTimer?: Partial<FirstTimerFormData & { id?: string }>;
  branches: { id: string; name: string }[];
  members: { id: string; fullName: string }[];
  onSubmit: (data: FirstTimerFormData) => void;
  onCancel: () => void;
  isSaving?: boolean;
  role: string;
}

export const FirstTimerForm: React.FC<FirstTimerFormProps> = ({
  firstTimer,
  branches,
  members,
  onSubmit,
  onCancel,
  isSaving = false,
  role,
}) => {
  const form = useForm<FirstTimerFormData>({
    resolver: zodResolver(firstTimerSchema) as any,
    defaultValues: {
      fullName: firstTimer?.fullName ?? '',
      email: firstTimer?.email ?? '',
      phone: firstTimer?.phone ?? '',
      community: firstTimer?.community ?? '',
      area: firstTimer?.area ?? '',
      street: firstTimer?.street ?? '',
      publicLandmark: firstTimer?.publicLandmark ?? '',
      serviceDate: firstTimer?.serviceDate ?? new Date().toISOString().split('T')[0],
      firstVisit: firstTimer?.firstVisit ?? new Date().toISOString().split('T')[0],
      invitedBy: firstTimer?.invitedBy ?? '',
      branchId: firstTimer?.branchId ?? (branches.length > 0 ? branches[0].id : ''),
      status: firstTimer?.status ?? 'new',
      followUpStatus: firstTimer?.followUpStatus ?? 'pending',
      followUpNotes: firstTimer?.followUpNotes ?? '',
      notes: firstTimer?.notes ?? '',
    },
  });

  const submit = (data: FirstTimerFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-12"
        >
          {/* Identity Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <User size={16} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Personal Information</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium" />
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
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Mail size={12} /> Email Address
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="identity@node.com" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
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
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Phone size={12} /> Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+Country Vector" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Residence Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MapPin size={16} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Location Information</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Area *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter district/area" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="House #, Street name" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publicLandmark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Navigation size={12} /> Navigation Landmark
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Near prominent structure" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Chronology Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50/10 flex items-center justify-center text-blue-500">
                <Calendar size={16} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Visit Information</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign Branch *</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={role !== 'superadmin' && role !== 'district'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-medium">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="font-medium text-sm py-3">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Visit Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstVisit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Visit Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invitedBy"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invited By</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(val) => field.onChange(val === '_none' ? '' : val)} 
                        value={field.value || '_none'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                            <SelectValue placeholder="Select orchestrating member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="_none" className="font-black text-[10px] uppercase tracking-widest py-3 text-slate-400">
                            No one / Walk-in
                          </SelectItem>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.fullName} className="font-bold text-[10px] uppercase tracking-widest py-3">
                              {m.fullName}
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

          {/* Follow-up Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <CheckCircle2 size={16} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Follow-up Status</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="new" className="font-bold text-[10px] uppercase tracking-widest py-3">New Visitor</SelectItem>
                          <SelectItem value="contacted" className="font-bold text-[10px] uppercase tracking-widest py-3">Contacted</SelectItem>
                          <SelectItem value="followed_up" className="font-bold text-[10px] uppercase tracking-widest py-3">Followed Up</SelectItem>
                          <SelectItem value="converted" className="font-bold text-[10px] uppercase tracking-widest py-3 text-emerald-600">Converted to Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="followUpStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement Strategy *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm font-bold">
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="pending" className="font-bold text-[10px] uppercase tracking-widest py-3">Pending</SelectItem>
                          <SelectItem value="called" className="font-bold text-[10px] uppercase tracking-widest py-3">Called</SelectItem>
                          <SelectItem value="visited" className="font-bold text-[10px] uppercase tracking-widest py-3">Visited</SelectItem>
                          <SelectItem value="completed" className="font-bold text-[10px] uppercase tracking-widest py-3">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="followUpNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <CheckCircle2 size={12} /> Follow-up Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Log detailed encounter dynamics..."
                        {...field}
                        className="bg-slate-50 min-h-[120px] rounded-2xl border-slate-200 focus:bg-white transition-all font-bold text-sm resize-none p-4 shadow-inner"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <MessageSquare size={12} /> Additional Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional tactical intelligence..."
                        {...field}
                        className="bg-slate-50 min-h-[120px] rounded-2xl border-slate-200 focus:bg-white transition-all font-bold text-sm resize-none p-4 shadow-inner"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pt-10 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 h-12 sm:h-14 px-10 rounded-2xl transition-all"
            >
              Abort Encounter
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest h-12 sm:h-14 px-8 sm:px-12 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 sm:gap-3 group disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />}
                {firstTimer && firstTimer.id ? 'Authorize Update' : 'Execute Recording'}
              </Button>
            </div>
          </div>
        </motion.div>
      </form>
    </Form>
  );
};
