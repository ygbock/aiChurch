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
  Check,
  Flame // For "Conversion" feel
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

const convertSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  gender: z.string().min(1, "Please select a gender"),
  dob: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  conversionDate: z.string().min(1, "Conversion date is required"),
  location: z.string().optional(),
  soulWinner: z.string().optional(),
  decision: z.string().min(1, "Decision is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

interface ConvertFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ConvertForm({ initialData, isEdit = false }: ConvertFormProps) {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: initialData || {
      fullName: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      maritalStatus: "Single",
      address: "",
      branchId: profile?.branchId || "",
      conversionDate: format(new Date(), "yyyy-MM-dd"),
      location: "Sunday Service",
      soulWinner: "",
      decision: "New Convert",
      category: "Adult",
      notes: "",
    },
  });

  useEffect(() => {
    async function fetchMetadata() {
      if (!profile?.districtId) return;
      setLoadingMetadata(true);
      try {
        const branchesRef = collection(db, "districts", profile.districtId, "branches");
        const branchesSnap = await getDocs(branchesRef);
        setBranches(branchesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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
      const convertData = {
        ...values,
        level: "Convert",
        status: "Active",
        districtId: profile.districtId,
        updatedAt: serverTimestamp(),
      };

      if (isEdit && initialData?.id) {
        const docRef = doc(db, `districts/${profile.districtId}/branches/${values.branchId}/members`, initialData.id);
        await updateDoc(docRef, convertData);
        toast.success("Convert updated successfully");
      } else {
        const docRef = collection(db, `districts/${profile.districtId}/branches/${values.branchId}/members`);
        const newDoc = await addDoc(docRef, {
          ...convertData,
          createdAt: serverTimestamp(),
          isProfileComplete: false,
        });
        await updateDoc(newDoc, { uid: newDoc.id, id: newDoc.id, memberId: newDoc.id });
        toast.success("Convert registered successfully");
      }
      navigate("/members");
    } catch (error: any) {
      console.error("Error saving convert:", error);
      toast.error(error.message || "Failed to save convert");
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

          {/* Conversion Details Section */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <Flame size={18} className="text-orange-600" />
              <h3 className="font-bold text-slate-900">Conversion Event</h3>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="conversionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Date of Decision *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-slate-50 border-slate-200" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Encounter Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                        <SelectItem value="Mid-week Service">Mid-week Service</SelectItem>
                        <SelectItem value="Outdoor Outreach">Outdoor Outreach</SelectItem>
                        <SelectItem value="Personal Evangelism">Personal Evangelism</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="soulWinner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Soul Winner (Member Name)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder={loadingMetadata ? "Loading members..." : "Select Soul Winner"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None / Anonymous</SelectItem>
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
                name="decision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Decision Outcome</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select Decision" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="New Convert">New Convert</SelectItem>
                        <SelectItem value="Rededication">Rededication</SelectItem>
                        <SelectItem value="Growth Track">Interested in Growth Track</SelectItem>
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
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Ministry Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Pastoral notes..." {...field} className="bg-slate-50 border-slate-200 min-h-[60px]" />
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
                Saving...
              </>
            ) : (
              isEdit ? "Update Convert" : "Register Convert"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
