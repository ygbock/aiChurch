import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDonationStore } from '../stores/useDonationStore';
import { CreditCard, Smartphone, Building, QrCode, User, Calendar, CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AccountingAutomation } from '../../accounting/services/automationRules';
import { SMSService } from '../services/sms.service';

export default function GivingPortal() {
  const { categories, currencies, addTransaction } = useDonationStore();

  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('SLE');
  const [phone, setPhone] = useState('');
  const [donationType, setDonationType] = useState(categories[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'orange' | 'afrimoney' | 'bank' | 'cash'>('orange');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(true);
  const [donorName, setDonorName] = useState('');

  const handleCheckout = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a valid donation amount.' });
      return;
    }
    
    if ((paymentMethod === 'orange' || paymentMethod === 'afrimoney') && !phone) {
      toast.error('Phone Number Required', { description: 'Please enter your mobile money number.' });
      return;
    }

    if ((paymentMethod === 'orange' || paymentMethod === 'afrimoney') && selectedCurrency !== 'SLE') {
      toast.error('Currency Not Supported', { description: 'Mobile money payments must be made in SLE.' });
      return;
    }

    const category = categories.find(c => c.id === donationType);
    if (!category) return;

    setIsProcessing(true);

    // Simulate API call to Monime or internal processing
    setTimeout(async () => {
      const txId = `TX-${Math.floor(Math.random() * 1000000)}`;
      
      const rate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
      // Convert to base currency (SLE) for total calculations, but store the original currency
      
      addTransaction({
        id: txId,
        date: new Date().toISOString(),
        status: 'Completed',
        donorName: isAnonymous ? 'Anonymous' : donorName || 'Guest User',
        categoryId: category.id,
        categoryName: category.name,
        method: paymentMethod === 'orange' ? 'Orange Money' : paymentMethod === 'afrimoney' ? 'Afrimoney' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash',
        reference: `M-${Date.now()}`,
        amount: Number(amount),
        currency: selectedCurrency,
        receiptUrl: sendReceipt ? `/receipts/${txId}.pdf` : undefined
      });

      // 1. Accounting Integration
      AccountingAutomation.syncDonation({
        id: txId,
        amount: Number(amount) * rate, // Sync in base currency
        category: category.name,
        paymentMethod: paymentMethod === 'orange' ? 'orange' : paymentMethod === 'afrimoney' ? 'afrimoney' : paymentMethod === 'bank' ? 'bank' : 'cash',
        date: new Date().toISOString(),
        donorName: isAnonymous ? undefined : donorName
      });

      // 2. SMS Receipt Integration
      if (sendReceipt && phone) {
        await SMSService.sendReceipt(phone, Number(amount), selectedCurrency, category.name, txId);
      }

      toast.success('Donation Successful', { description: `Successfully processed ${selectedCurrency} ${amount} for ${category.name}` });
      setIsProcessing(false);
      setAmount('');
      setPhone('');
      setDonorName('');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Process Donation</h2>
          <p className="text-slate-500">Record a new contribution or process a mobile money payment via Monime.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Donation Category</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setDonationType(cat.id)}
                  className={`px-3 py-3 border rounded-xl text-sm font-medium transition-all text-center ${
                    donationType === cat.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-slate-200 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50'
                  }`}
                >
                  <span className="block font-bold">{cat.name}</span>
                  <span className="block text-xs opacity-80 font-normal mt-0.5 truncate">{cat.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Amount</label>
            <div className="relative flex">
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="absolute left-0 top-0 bottom-0 px-4 bg-slate-100 border-y border-l border-slate-200 rounded-l-xl text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500 z-10"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full pl-[100px] pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" 
              />
            </div>
            {selectedCurrency !== 'SLE' && (
               <p className="mt-2 text-xs font-medium text-emerald-600">
                 Estimated in SLE: Le {(Number(amount || 0) * (currencies.find(c => c.code === selectedCurrency)?.rate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
            )}
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <User size={16} className="text-slate-500" />
                 Anonymous Giving
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            {!isAnonymous && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Member/Donor Name" value={donorName} onChange={(e) => setDonorName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'orange' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-500 bg-white'}`}>
                <input type="radio" name="method" className="sr-only" checked={paymentMethod === 'orange'} onChange={() => setPaymentMethod('orange')} />
                <Smartphone size={24} className="text-orange-500" />
                <span className="text-xs font-bold text-center text-slate-900">Orange Money</span>
              </label>
              <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'afrimoney' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-500 bg-white'}`}>
                <input type="radio" name="method" className="sr-only" checked={paymentMethod === 'afrimoney'} onChange={() => setPaymentMethod('afrimoney')} />
                <Smartphone size={24} className="text-purple-600" />
                <span className="text-xs font-bold text-center text-slate-900">Afrimoney</span>
              </label>
              <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-500 bg-white'}`}>
                <input type="radio" name="method" className="sr-only" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                <Building size={24} className="text-blue-600" />
                <span className="text-xs font-bold text-center text-slate-900">Bank Tx</span>
              </label>
              <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-slate-800 bg-slate-100' : 'border-slate-200 hover:border-slate-800 bg-white'}`}>
                <input type="radio" name="method" className="sr-only" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                <QrCode size={24} className="text-slate-700" />
                <span className="text-xs font-bold text-center text-slate-900">Cash/QR</span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {(paymentMethod === 'orange' || paymentMethod === 'afrimoney') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <label className="block text-sm font-bold text-slate-900 mb-2">Mobile Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 076 123 456" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
              <div className="flex items-center gap-3">
                <Calendar size={20} className={isRecurring ? "text-emerald-500" : "text-slate-400"} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Recurring</p>
                  <p className="text-xs text-slate-500">Auto-give monthly</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isRecurring ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                {isRecurring && <CheckCircle2 size={12} />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setSendReceipt(!sendReceipt)}>
              <div className="flex items-center gap-3">
                <Mail size={20} className={sendReceipt ? "text-blue-500" : "text-slate-400"} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Send Receipt</p>
                  <p className="text-xs text-slate-500">SMS/Email alert</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sendReceipt ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white'}`}>
                {sendReceipt && <CheckCircle2 size={12} />}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : null}
              {isProcessing ? 'Processing...' : (paymentMethod === 'orange' || paymentMethod === 'afrimoney') ? 'Process Payment via Monime' : 'Record Manual Transaction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
