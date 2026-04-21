import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where,
  collectionGroup,
  limit
} from "firebase/firestore";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { db } from "../lib/firebase";
import { useFirebase } from "./FirebaseProvider";
import { toast } from "sonner";

const visitorSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  gender: z.string().min(1, "Please select a gender"),
  dob: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  source: z.string().optional(),
  invitedBy: z.string().optional(),
  isFirstTime: z.string().min(1, "First time selection is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

type VisitorFormValues = z.infer<typeof visitorSchema>;

interface VisitorFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function VisitorForm({ initialData, isEdit = false }: VisitorFormProps) {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    defaultValues: initialData || {
      fullName: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      maritalStatus: "Single",
      address: "",
      branchId: profile?.branchId || "",
      visitDate: format(new Date(), "yyyy-MM-dd"),
      source: "",
      invitedBy: "",
      isFirstTime: "Yes",
      category: "Adult",
      notes: "",
    },
  });

  useEffect(() => {
    async function fetchMetadata() {
      if (!profile?.districtId) return;
      setLoadingMetadata(true);
      try {
        // Fetch branches in the district
        const branchesRef = collection(db, "districts", profile.districtId, "branches");
        const branchesSnap = await getDocs(branchesRef);
        setBranches(branchesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch members for "Invited By" dropdown (limited to branch if possible)
        let membersQuery;
        if (profile.branchId) {
          membersQuery = query(
            collection(db, "districts", profile.districtId, "branches", profile.branchId, "members"),
            limit(100)
          );
        } else {
          membersQuery = query(
            collectionGroup(db, "members"), 
            where("districtId", "==", profile.districtId),
            limit(100)
          );
        }
        const membersSnap = await getDocs(membersQuery);
        setMembers(membersSnap.docs.map(d => ({ id: d.id, fullName: d.data().fullName })));
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setLoadingMetadata(false);
      }
    }
    fetchMetadata();
  }, [profile]);

  // Update branchId when profile loads
  useEffect(() => {
    if (profile?.branchId && !isEdit) {
      form.setValue("branchId", profile.branchId);
    }
  }, [profile, isEdit, form]);

  const onSubmit = async (values: any) => {
    if (!profile?.districtId) {
      toast.error("User context missing. Please refresh.");
      return;
    }

    setIsSubmitting(true);
    try {
      const visitorData = {
        ...values,
        level: "Visitor",
        status: "Active",
        districtId: profile.districtId,
        updatedAt: serverTimestamp(),
      };

      if (isEdit && initialData?.id) {
        const docRef = doc(db, `districts/${profile.districtId}/branches/${values.branchId}/members`, initialData.id);
        await updateDoc(docRef, visitorData);
        toast.success("Visitor updated successfully");
      } else {
        const docRef = collection(db, `districts/${profile.districtId}/branches/${values.branchId}/members`);
        const newDoc = await addDoc(docRef, {
          ...visitorData,
          createdAt: serverTimestamp(),
          isProfileComplete: false,
        });
        // Set uid for consistency with current system
        await updateDoc(newDoc, { uid: newDoc.id, id: newDoc.id });
        toast.success("Visitor registered successfully");
      }
      navigate("/members");
    } catch (error: any) {
      console.error("Error saving visitor:", error);
      toast.error(error.message || "Failed to save visitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity Section */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-900">Personal Identity</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} className="bg-slate-50 border-slate-200" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-slate-50 border-slate-200" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Phone Number *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="000 000 0000" {...field} className="pl-10 bg-slate-50 border-slate-200" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="email@example.com" {...field} className="pl-10 bg-slate-50 border-slate-200" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Residential Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea placeholder="Enter full address" {...field} className="pl-10 bg-slate-50 border-slate-200 min-h-[80px]" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Encounter Details Section */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <CalendarIcon size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-900">Encounter Details</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Branch *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder={loadingMetadata ? "Loading branches..." : "Select Branch"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Date of First Visit *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-slate-50 border-slate-200" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isFirstTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">First time here?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Allocation Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Adult">Adult</SelectItem>
                          <SelectItem value="Teen">Teen</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">How did you hear about us?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Friend/Family">Friend/Family</SelectItem>
                        <SelectItem value="Flyer">Flyer</SelectItem>
                        <SelectItem value="Billboard">Billboard</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invitedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Who invited you? (Member)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder={loadingMetadata ? "Loading members..." : "Select Member"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None / Walk-in</SelectItem>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.fullName}>{m.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any other info..." {...field} className="bg-slate-50 border-slate-200 min-h-[60px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="rounded-xl px-8"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-slate-900 text-white rounded-xl px-12 font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              isEdit ? "Update Visitor" : "Register Visitor"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
