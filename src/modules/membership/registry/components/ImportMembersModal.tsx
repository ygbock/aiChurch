import React, { useState, useRef } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Upload, FileType, CheckCircle, AlertCircle, Loader2, ArrowRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { writeBatch, collection, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDistrictId?: string;
  defaultBranchId?: string;
}

export const ImportMembersModal: React.FC<ImportMembersModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultDistrictId,
  defaultBranchId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useFirebase();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.');
      return;
    }
    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Errors occurred while parsing the CSV.');
          return;
        }
        setParsedData(results.data);
        setStep(2);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (!profile) return;
    setIsUploading(true);

    try {
      const batch = writeBatch(db);
      
      const targetDistrict = defaultDistrictId || profile.districtId || 'unassigned';
      const targetBranch = defaultBranchId || profile.branchId || 'unassigned';

      let validCount = 0;

      for (const row of parsedData) {
        // Map CSV headers to member data
        const fullName = row['Name'] || row['Full Name'] || row['fullName'] || row['name'];
        if (!fullName) continue;

        const memberRef = doc(collection(db, `districts/${targetDistrict}/branches/${targetBranch}/members`));
        
        const memberData = {
          id: memberRef.id,
          fullName,
          phone: row['Phone'] || row['phone'] || '',
          email: row['Email'] || row['email'] || '',
          gender: row['Gender'] || row['gender'] || 'Unknown',
          level: row['Level'] || row['level'] || 'Member',
          status: 'Active',
          baptismStatus: 'Pending',
          isBaptised: false,
          joinDate: new Date().toISOString().split('T')[0],
          districtId: targetDistrict,
          branchId: targetBranch,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(memberRef, memberData);
        validCount++;
        
        // Firestore limits batches to 500 operations
        if (validCount % 450 === 0) {
           await batch.commit();
        }
      }

      await batch.commit();
      
      toast.success(`Successfully imported ${validCount} members.`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Name,Phone,Email,Gender,Level\nJohn Doe,+1234567890,john@example.com,Male,Member";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'members_import_template.csv');
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setStep(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Members">
      {step === 1 ? (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-900">
                <p className="font-bold mb-1">CSV Format Requirements</p>
                <p className="text-blue-700">
                  Your CSV file must include headers in the first row. The system will look for columns named: <strong>Name</strong>, <strong>Phone</strong>, <strong>Email</strong>, <strong>Gender</strong>, <strong>Level</strong>.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadTemplate}
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
            >
              <Download size={14} className="mr-2" />
              Download Template
            </Button>
          </div>

          <div 
            className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Upload size={28} />
            </div>
            <p className="font-bold text-slate-800 text-lg mb-1">Click or drag CSV file here</p>
            <p className="text-slate-500 text-sm">Supports .csv files up to 5MB</p>
            <input 
              type="file" 
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
              <FileType size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 flex items-center gap-2">
                {file?.name}
                <CheckCircle size={16} className="text-emerald-500" />
              </p>
              <p className="text-slate-500 text-sm">{parsedData.length} records found</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-500">
              Change File
            </Button>
          </div>

          <div className="bg-white border text-sm text-left border-slate-200 rounded-xl overflow-hidden overflow-x-auto max-h-60">
             <table className="w-full">
               <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                 <tr>
                   {parsedData[0] && Object.keys(parsedData[0]).map((header) => (
                     <th key={header} className="px-4 py-3 font-bold text-slate-600 truncate max-w-[150px]">{header}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {parsedData.slice(0, 5).map((row, i) => (
                   <tr key={i}>
                     {Object.values(row).map((val: any, j) => (
                       <td key={j} className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{val}</td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
             {parsedData.length > 5 && (
               <div className="p-3 text-center bg-slate-50 text-slate-500 text-xs font-bold border-t border-slate-200">
                 Showing 5 of {parsedData.length} rows
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={handleClose}
              disabled={isUploading}
              className="font-bold px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isUploading || parsedData.length === 0}
              className="font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Start Import
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
