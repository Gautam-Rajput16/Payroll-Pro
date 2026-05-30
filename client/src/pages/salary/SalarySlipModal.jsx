import React, { useState, useEffect } from 'react';
import { X, Printer, Building2, MapPin, Download } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const SalarySlipModal = ({ isOpen, onClose, employeeId, month, year }) => {
  const [loading, setLoading] = useState(true);
  const [slipData, setSlipData] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (isOpen && employeeId && month && year) {
      fetchSlipData();
    }
  }, [isOpen, employeeId, month, year]);

  const fetchSlipData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/salary/slip/${employeeId}`, {
        params: { month, year }
      });
      setSlipData(res.data.data);
    } catch (error) {
      toast.error('Failed to load salary slip');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 print:p-0 print:bg-white print:relative print:z-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible relative flex flex-col">
        
        {/* Header - Not printed */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-xl print:hidden">
          <h3 className="text-lg font-bold text-gray-900">Salary Slip</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint} disabled={loading}>
              Print
            </Button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 print:p-0 bg-white flex-1" id="printable-slip">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : slipData ? (
            <div className="max-w-3xl mx-auto border border-gray-200 print:border-none">
              
              {/* Company Header */}
              <div className="p-6 border-b border-gray-200 flex flex-col items-center justify-center text-center">
                {slipData.organisationLogo ? (
                  <img src={slipData.organisationLogo} alt="Company Logo" className="h-16 mb-2" />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <Building2 className="text-primary w-6 h-6" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  {slipData.organisationName}
                </h1>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <MapPin size={14} /> {slipData.orgAddress || 'Corporate Office'}
                </p>
                <h2 className="text-lg font-semibold text-gray-700 mt-4 uppercase">
                  Payslip for the month of {months[month - 1]} {year}
                </h2>
              </div>

              {/* Employee & Salary Summary Grid */}
              <div className="grid grid-cols-2 gap-0 border-b border-gray-200 text-sm">
                <div className="p-4 border-r border-gray-200 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Employee Name:</span>
                    <span className="font-semibold text-gray-900">{slipData.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Employee ID:</span>
                    <span className="text-gray-900">{slipData.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Designation:</span>
                    <span className="text-gray-900">{slipData.designation}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Total Working Days:</span>
                    <span className="text-gray-900">{slipData.workingDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Total Present Days:</span>
                    <span className="text-gray-900">{slipData.presentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className={`font-semibold ${slipData.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {slipData.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 text-sm border-b border-gray-200">
                {/* Earnings */}
                <div className="border-r border-gray-200">
                  <div className="bg-gray-50 p-2 border-b border-gray-200 font-bold text-gray-700 text-center uppercase tracking-wide">
                    Earnings
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Monthly Base Salary</span>
                      <span className="text-gray-900">₹{slipData.monthlySalary?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Gross Payable Earnings</span>
                      <span className="font-semibold text-gray-900">₹{slipData.grossSalary?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div className="bg-gray-50 p-2 border-b border-gray-200 font-bold text-gray-700 text-center uppercase tracking-wide">
                    Deductions
                  </div>
                  <div className="p-4 space-y-4">
                    {slipData.advanceBreakdown && slipData.advanceBreakdown.length > 0 ? (
                      slipData.advanceBreakdown.map((adv, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-gray-700">Advance ({new Date(adv.date).toLocaleDateString()})</span>
                          <span className="text-gray-900">₹{adv.amount?.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Advances taken</span>
                        <span className="text-gray-900">₹0</span>
                      </div>
                    )}
                    <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total Deductions</span>
                      <span className="font-semibold text-red-600">₹{slipData.totalAdvances?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Net Payable */}
              <div className="bg-primary/5 p-6 flex justify-between items-center">
                <div className="text-gray-700 font-bold uppercase tracking-wider">
                  Net Salary Payable
                </div>
                <div className="text-3xl font-extrabold text-primary">
                  ₹{slipData.netSalary?.toLocaleString('en-IN')}
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 text-center text-xs text-gray-400 border-t border-gray-200">
                <p>This is a computer-generated document. No signature is required.</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString()} via PayrollPro System.</p>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p>Slip data not available.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Global styles to hide everything else when printing this modal */}
      <style>{`
        @media print {
          body {
            visibility: hidden;
            background: white;
          }
          #printable-slip {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SalarySlipModal;
