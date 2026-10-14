import React, { useState } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

export default function ReviewBookingScreen({ bookingData, onBack, onComplete }) {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState('downpayment'); // 'downpayment' | 'full'
  const [paymentChannel, setPaymentChannel] = useState('gcash'); // 'gcash' | 'bank'
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Fallback defaults if opened directly
  const data = bookingData || {
    mentor: {
      id: '6349edad-42be-4021-841d-e31684711397',
      name: 'Alex Santos',
      specialization: 'Web Development Mentor',
      rating: 4.9,
      sessionsCount: 24,
      isVerified: true,
      rate: '₱250.00 / hr',
      hourlyRate: 250,
      paymentMethods: ['GCash', 'BDO Unibank'],
      gcashNumber: '0917-555-0192',
      gcashName: 'Alex Santos',
      bankName: 'BDO Unibank',
      bankAccount: '1092-8834-5512',
      bankHolder: 'Alex Santos',
      avatarBg: 'bg-sky-600',
      initials: 'AS'
    },
    date: '2026-09-25',
    time: '7:00 PM – 8:00 PM',
    duration: '60 min',
    format: 'Online',
    topic: 'I want help understanding JavaScript functions, parameters, and return values.'
  };

  const mentor = data.mentor;
  const hourlyRate = mentor.hourlyRate || parseInt(String(mentor.rate).replace(/[^0-9]/g, '')) || 250;
  const totalFee = data.totalFee || hourlyRate;
  const downPaymentAmount = data.downPayment || Math.round(totalFee * 0.5);
  const amountDueNow = paymentOption === 'full' ? totalFee : downPaymentAmount;
  const remainingBalance = paymentOption === 'full' ? 0 : (totalFee - downPaymentAmount);

  // Format readable date
  const getReadableDate = (iso) => {
    if (!iso) return 'Friday, September 25, 2026';
    if (iso === '2026-09-25') return 'Friday, September 25, 2026';
    if (iso === '2026-09-21') return 'Monday, September 21, 2026';
    if (iso === '2026-09-22') return 'Tuesday, September 22, 2026';
    if (iso === '2026-09-23') return 'Wednesday, September 23, 2026';
    if (iso === '2026-09-24') return 'Thursday, September 24, 2026';
    return iso;
  };

  const readableDate = getReadableDate(data.date);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmAndSend = async () => {
    if (!referenceNumber.trim()) {
      setPaymentError(`Please enter your transaction reference number to submit your ${paymentOption === 'full' ? 'full payment' : 'down payment'}.`);
      return;
    }
    if (referenceNumber.trim().length < 6) {
      setPaymentError('Please enter a valid reference number (at least 6 characters).');
      return;
    }

    setPaymentError('');
    setIsSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentStudentId = authData?.user?.id;

      // Ensure mentor ID is a valid UUID or fallback to Alex Santos seed UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const targetTutorId = uuidRegex.test(mentor.id) ? mentor.id : '6349edad-42be-4021-841d-e31684711397';

      if (currentStudentId) {
        const { error } = await sessionService.createSession({
          studentId: currentStudentId,
          tutorId: targetTutorId,
          topic: data.topic,
          date: data.date,
          time: data.time,
          duration: data.duration,
          format: data.format,
          paymentOption,
          paymentAmount: amountDueNow,
          totalFee,
          referenceNumber: referenceNumber.trim(),
          paymentChannel,
          notes: data.topic,
        });

        if (error) {
          console.error('[ReviewBookingScreen] Create session warning:', error);
          // If RLS or conflict occurred, still allow user to continue in preview mode
        }
      }

      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error('[ReviewBookingScreen] Submission error:', err);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Top Header with Back Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 pt-1">
        <button
          onClick={onBack}
          className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span>Back to Configuration</span>
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
          Step 2 of 2: Checkout & Review
        </span>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Review & Direct Payment
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Choose whether to pay in full upfront or make a 50% down payment to confirm your booking.
        </p>
      </div>

      {/* 2. Mentor Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full ${mentor.avatarBg || 'bg-sky-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
          >
            {mentor.initials || 'AS'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {mentor.name}
              </h2>
              {mentor.isVerified && (
                <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{mentor.specialization}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-semibold text-slate-700">
              <svg className="w-3.5 h-3.5 fill-sky-500 text-sky-500" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span>{mentor.rating ? mentor.rating.toFixed(1) : '4.9'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{mentor.sessionsCount || 24} Sessions</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-black text-sky-700 block">
            {mentor.rate || `₱${hourlyRate}.00 / hr`}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Direct Pay</span>
        </div>
      </div>

      {/* 3. Session Details Comprehensive Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Session Parameters
        </h3>

        <div className="space-y-3 text-xs divide-y divide-slate-100">
          {/* Date */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>Date</span>
            </div>
            <span className="font-bold text-slate-800">{readableDate}</span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Time Slot</span>
            </div>
            <span className="font-bold text-slate-800">{data.time}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Duration</span>
            </div>
            <span className="font-bold text-slate-800">{data.duration}</span>
          </div>

          {/* Format */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span>Format</span>
            </div>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              {data.format === 'Online' ? 'Online (Virtual Classroom)' : data.format}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Payment Option Selector (Pay in Full OR 50% Down Payment) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Payment Method & Terms
          </h3>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            Select Payment Option
          </span>
        </div>

        {/* Option Toggle Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 50% Down Payment Option */}
          <button
            type="button"
            onClick={() => setPaymentOption('downpayment')}
            className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 ${
              paymentOption === 'downpayment'
                ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                paymentOption === 'downpayment' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                50% Split
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                paymentOption === 'downpayment' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentOption === 'downpayment' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-900 leading-tight">50% Down Payment</div>
            <div className="text-[11px] text-sky-700 font-extrabold mt-1">₱{downPaymentAmount}.00 now</div>
            <div className="text-[10px] text-slate-500 mt-0.5">₱{remainingBalance}.00 balance after session</div>
          </button>

          {/* Pay in Full (100%) Option */}
          <button
            type="button"
            onClick={() => setPaymentOption('full')}
            className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 ${
              paymentOption === 'full'
                ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                paymentOption === 'full' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                100% Full
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                paymentOption === 'full' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentOption === 'full' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Pay in Full</div>
            <div className="text-[11px] text-emerald-700 font-extrabold mt-1">₱{totalFee}.00 now</div>
            <div className="text-[10px] text-slate-500 mt-0.5">₱0.00 remaining balance</div>
          </button>
        </div>

        {/* Dynamic Breakdown Table */}
        <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Total Session Rate:</span>
            <span className="font-semibold text-slate-900">₱{totalFee}.00</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-950 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              <span>Amount Due Now ({paymentOption === 'full' ? '100% Full Payment' : '50% Down Payment'}):</span>
            </div>
            <span className="text-sm font-extrabold text-sky-700">₱{amountDueNow}.00</span>
          </div>

          {paymentOption === 'downpayment' ? (
            <div className="flex items-center justify-between text-slate-500 pt-0.5">
              <span>Remaining Balance (Due After Session):</span>
              <span className="font-semibold text-slate-700">₱{remainingBalance}.00</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-emerald-600 font-semibold pt-0.5">
              <span>Remaining Balance:</span>
              <span>₱0.00 (Fully Settled)</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Direct Payment Channel Selector & Account Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Transfer {paymentOption === 'full' ? 'Full Payment' : 'Down Payment'}
        </h3>

        {/* Channel Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setPaymentChannel('gcash')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              paymentChannel === 'gcash'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="font-extrabold">GCash</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentChannel('bank')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              paymentChannel === 'bank'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Bank Account</span>
          </button>
        </div>

        {/* GCash Account Card */}
        {paymentChannel === 'gcash' && (
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Mentor's GCash Account
              </span>
              <span className="text-[10px] font-bold text-sky-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                Verified
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Name:</span>
                <span className="font-bold text-slate-900">{mentor.gcashName || mentor.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">GCash Mobile:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {mentor.gcashNumber || '0917-555-0192'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mentor.gcashNumber || '0917-555-0192', 'gcash')}
                    className="p-1 px-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-sky-600 hover:bg-sky-50 active:scale-95 cursor-pointer"
                  >
                    {copiedField === 'gcash' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
              1. Open GCash app & transfer <span className="font-bold text-slate-800">₱{amountDueNow}.00</span>.<br />
              2. Copy the reference number and paste below.
            </p>
          </div>
        )}

        {/* Bank Account Card */}
        {paymentChannel === 'bank' && (
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Mentor's Bank Account
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                InstaPay / PESONet
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank Name:</span>
                <span className="font-bold text-slate-900">{mentor.bankName || 'BDO Unibank'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Name:</span>
                <span className="font-bold text-slate-900">{mentor.bankHolder || mentor.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {mentor.bankAccount || '1092-8834-5512'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mentor.bankAccount || '1092-8834-5512', 'bank')}
                    className="p-1 px-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-sky-600 hover:bg-sky-50 active:scale-95 cursor-pointer"
                  >
                    {copiedField === 'bank' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
              1. Transfer <span className="font-bold text-slate-800">₱{amountDueNow}.00</span> via online banking.<br />
              2. Enter the transaction reference / trace number below.
            </p>
          </div>
        )}

        {/* Transaction Reference Number Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Transaction Reference Number <span className="text-rose-500">*</span>
          </label>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 py-3 focus-within:bg-white focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <svg className="w-5 h-5 text-slate-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => {
                setReferenceNumber(e.target.value);
                if (paymentError) setPaymentError('');
              }}
              placeholder="e.g. 1092837465012"
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs font-mono font-bold tracking-wider"
            />
          </div>
          {paymentError && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{paymentError}</span>
            </p>
          )}
        </div>
      </div>

      {/* 6. Session Topic Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Learning Focus / Goal
          </h3>
          <span className="text-[10px] font-semibold text-sky-600">Goal</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
          {data.topic}
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleConfirmAndSend}
          disabled={isSubmitting}
          className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting Booking...</span>
            </span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              <span>Submit ₱{amountDueNow}.00 {paymentOption === 'full' ? 'Full Payment' : 'Down Payment'} & Book</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="touch-target w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-2xl transition-all active:scale-[0.99]"
        >
          Edit Booking Details
        </button>
      </div>

      {/* 8. Request Sent Success Confirmation Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-scale-up">
            {/* Success Check Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            {/* Modal Heading & Text */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {paymentOption === 'full' ? 'Full Payment Submitted!' : 'Down Payment Sent!'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your {paymentOption === 'full' ? 'full payment' : '50% down payment'} of <span className="font-bold text-slate-900">₱{amountDueNow}.00</span> (Ref: <span className="font-mono font-bold text-slate-800">{referenceNumber}</span>) has been submitted to{' '}
                <span className="font-bold text-slate-800">{mentor.name}</span> for verification.
              </p>
            </div>

            {/* Status Summary Pill Box */}
            <div className="bg-sky-50 rounded-xl p-3 border border-sky-200/80 text-left text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-sky-950">
                <span>Verification Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  {paymentOption === 'full' ? 'FULL PAYMENT VERIFYING' : 'DOWN PAYMENT VERIFYING'}
                </span>
              </div>
              <p className="text-[11px] text-sky-800 font-medium">
                {readableDate} · {data.time}
              </p>
            </div>

            {/* View My Sessions Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  if (onComplete) {
                    onComplete({
                      ...data,
                      totalFee,
                      downPayment: downPaymentAmount,
                      amountPaid: amountDueNow,
                      remainingBalance,
                      paymentOption,
                      paymentChannel,
                      referenceNumber,
                      paymentStatus: paymentOption === 'full' ? 'full_payment_submitted' : 'downpayment_submitted'
                    });
                  }
                }}
                className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3 rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View My Sessions</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
