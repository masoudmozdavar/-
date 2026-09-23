import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FamilyMember, FamilyRole } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { FamilyMemberAccessModal } from './FamilyMemberAccessModal';
import { GraphicAvatar } from '../common/GraphicAvatar';
import { GraphicCharacterPicker } from '../common/GraphicCharacterPicker';
import { 
  Users, 
  UserPlus, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  Check, 
  X, 
  ExternalLink, 
  QrCode, 
  KeyRound, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AVATAR_OPTIONS = ['👨', '👩', '👧', '👦', '👵', '🧓', '👶', '🧑', '👱‍♀️', '🧔'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const FamilyManager: React.FC = () => {
  const { 
    familyMembers, 
    accounts, 
    transactions, 
    allowanceRequests, 
    approveAllowanceRequest, 
    rejectAllowanceRequest, 
    addFamilyMember, 
    updateFamilyMember, 
    deleteFamilyMember, 
    currency, 
    language,
    memberSpendingStats,
    switchMemberProfile,
    memberAccessModalFor,
    setMemberAccessModalFor
  } = useFinance();

  const isFa = language === 'fa';

  // Add/Edit Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<FamilyRole>('child');
  const [avatar, setAvatar] = useState('👧');
  const [color, setColor] = useState('#8b5cf6');
  const [monthlyAllowance, setMonthlyAllowance] = useState('');
  const [pin, setPin] = useState('');
  const [selectedAllowedAccounts, setSelectedAllowedAccounts] = useState<string[]>([]);

  // Approve Request Dialog State
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [approveSourceAccountId, setApproveSourceAccountId] = useState<string>(accounts[0]?.id || '');

  // Filter for family transactions
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  const pendingRequests = allowanceRequests.filter(r => r.status === 'pending');

  const totalFamilySpentThisMonth = memberSpendingStats.reduce((sum, m) => sum + m.totalSpentThisMonth, 0);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRole('child');
    setAvatar('👧');
    setColor('#8b5cf6');
    setMonthlyAllowance('');
    setPin('');
    setSelectedAllowedAccounts(accounts.map(a => a.id));
    setIsMemberModalOpen(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setAvatar(member.avatar);
    setColor(member.color);
    setMonthlyAllowance(member.monthlyAllowance ? member.monthlyAllowance.toString() : '');
    setPin(member.pin || '');
    setSelectedAllowedAccounts(member.allowedAccountIds || accounts.map(a => a.id));
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const allowanceNum = parseFloat(monthlyAllowance.replace(/,/g, '')) || 0;

    if (editingMember) {
      updateFamilyMember(editingMember.id, {
        name: name.trim(),
        role,
        avatar,
        color,
        monthlyAllowance: allowanceNum,
        pin: pin.trim() || undefined,
        allowedAccountIds: selectedAllowedAccounts,
      });
    } else {
      addFamilyMember({
        name: name.trim(),
        role,
        avatar,
        color,
        monthlyAllowance: allowanceNum,
        pin: pin.trim() || undefined,
        allowedAccountIds: selectedAllowedAccounts,
      });
    }

    setIsMemberModalOpen(false);
  };

  const handleConfirmApprove = (requestId: string) => {
    if (!approveSourceAccountId) return;
    approveAllowanceRequest(requestId, approveSourceAccountId);
    setApprovingRequestId(null);
  };

  // Filtered transactions
  const filteredFamilyTransactions = transactions.filter(t => {
    if (selectedMemberFilter === 'all') return true;
    if (selectedMemberFilter === 'head') return !t.memberId || t.memberId === 'head';
    return t.memberId === selectedMemberFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Overview Stats */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {isFa ? 'مدیریت و حسابداری خانواده' : 'Family Finance Hub'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'ایجاد حساب برای اعضا، تفکیک مخارج و تجمیع خودکار در حساب اصلی سرپرست' : 'Manage family member accounts, sync routine transactions & allowance'}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Badges & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isFa ? 'مجموع مخارج خانواده (ماه جاری)' : 'Total Family Spent'}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {formatCurrency(totalFamilySpentThisMonth, currency, isFa)}
            </span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isFa ? 'اعضای خانواده' : 'Members'}</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
              {isFa ? toPersianDigits(familyMembers.length) : familyMembers.length} {isFa ? 'نفر' : ''}
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isFa ? 'افزودن عضو جدید خانواده' : 'Add Family Member'}</span>
          </button>
        </div>
      </div>

      {/* Pending Allowance Requests Alert (if any) */}
      {pendingRequests.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <Coins className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>{isFa ? `درخواست‌های جدید پول توجیبی و شارژ (${toPersianDigits(pendingRequests.length)} مورد)` : 'Pending Allowance Requests'}</span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              {isFa ? 'با تأیید، مبلغ از حساب انتخابی کسر و ثبت می‌گردد' : 'Approve to deduct and record expense'}
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.map((req, idx) => (
              <div 
                key={`fm-req-${req.id}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex items-center justify-center text-lg">
                    {req.memberAvatar || '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{req.memberName}</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(req.amount, currency, isFa)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      بابت: {req.reason} • <span className="font-mono">{req.jalaliDate}</span>
                    </p>
                  </div>
                </div>

                {approvingRequestId === req.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={approveSourceAccountId}
                      onChange={(e) => setApproveSourceAccountId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                    >
                      {accounts.map((a, idx) => (
                        <option key={`fm-acc-opt-${a.id}-${idx}`} value={a.id}>
                          از {a.name} ({formatCurrency(a.balance, currency, isFa)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleConfirmApprove(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {isFa ? 'تأیید نهایی' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setApprovingRequestId(null)}
                      className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isFa ? 'انصراف' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setApprovingRequestId(req.id);
                        setApproveSourceAccountId(accounts[0]?.id || '');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isFa ? 'تأیید و پرداخت' : 'Approve'}</span>
                    </button>
                    <button
                      onClick={() => rejectAllowanceRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isFa ? 'رد' : 'Reject'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{isFa ? 'اعضای تعریف شده در سامانه' : 'Family Members Accounts'}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isFa ? 'هر عضو دارای لینک دسترسی و پنل روتین اختصاصی است' : 'Members have dedicated routine view'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member, idx) => {
            const isHead = member.role === 'head';
            const stats = memberSpendingStats.find(s => s.memberId === member.id);
            const spent = stats?.totalSpentThisMonth || 0;
            const allowance = member.monthlyAllowance || 0;
            const percent = stats?.allowancePercent || 0;

            return (
              <div 
                key={`fm-member-card-${member.id}-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Top Bar: Avatar & Role */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <GraphicAvatar
                        avatarId={member.avatar}
                        size="lg"
                        ring={true}
                        ringColor={member.color || '#3b82f6'}
                        showBadge={true}
                      />
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.pin && (
                            <span title="دارای رمز اختصاصی" className="text-amber-500">
                              <KeyRound className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 inline-block mt-0.5">
                          {isHead ? 'سرپرست خانواده' : member.role === 'spouse' ? 'همسر' : member.role === 'child' ? 'فرزند' : 'عضو خانواده'}
                        </span>
                      </div>
                    </div>

                    {!isHead && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="ویرایش مشخصات"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteFamilyMember(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف عضو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Spending & Allowance Info */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{isFa ? 'مخارج ماه جاری:' : 'Monthly spent:'}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(spent, currency, isFa)}
                      </span>
                    </div>

                    {allowance > 0 ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            {isFa ? 'سقف سهمیه:' : 'Allowance:'} {formatCurrency(allowance, currency, isFa)}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {isFa ? toPersianDigits(percent) : percent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        {isHead ? (isFa ? 'حساب اصلی سرپرست' : 'Primary account') : (isFa ? 'بدون محدودیت سقف هزینه' : 'No allowance limit')}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{isFa ? 'تعداد تراکنش‌های ثبت‌شده:' : 'Transactions:'}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {isFa ? toPersianDigits(stats?.transactionCount || 0) : (stats?.transactionCount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {!isHead && (
                    <button
                      onClick={() => setMemberAccessModalFor(member)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isFa ? 'لینک و دسترسی' : 'Access Link'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => switchMemberProfile(member.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isHead ? (isFa ? 'داشبورد اصلی' : 'Main Dashboard') : (isFa ? 'ورود به پنل روتین' : 'Test View')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregated Family Transactions Ledger */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{isFa ? 'دفتر کل و تراکنش‌های تجمیعی خانواده' : 'Aggregated Family Ledger'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa ? 'تمام تراکنش‌های ثبت‌شده توسط اعضا در این بخش نمایش و محاسبه می‌شوند' : 'All transactions logged by members aggregate here'}
            </p>
          </div>

          {/* Member Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedMemberFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedMemberFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isFa ? 'همه اعضا' : 'All'}
            </button>
            {familyMembers.map((m, idx) => (
              <button
                key={`fm-filter-mem-${m.id}-${idx}`}
                onClick={() => setSelectedMemberFilter(m.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedMemberFilter === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{m.avatar}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredFamilyTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {isFa ? 'تراکنشی برای این فیلتر ثبت نشده است.' : 'No transactions match this filter.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFamilyTransactions.slice(0, 15).map((t, idx) => {
              const member = familyMembers.find(m => m.id === t.memberId) || (t.memberId ? null : familyMembers[0]);
              const memberName = t.memberName || member?.name || 'سرپرست';
              const memberAvatar = member?.avatar || '👑';
              const memberColor = member?.color || '#3b82f6';

              return (
                <div 
                  key={`fm-tx-item-${t.id}-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-xs"
                      style={{ backgroundColor: `${memberColor}20` }}
                      title={`ثبت شده توسط: ${memberName}`}
                    >
                      {memberAvatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.description || 'تراکنش'}
                        </span>
                        <span 
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: `${memberColor}15`, color: memberColor }}
                        >
                          {memberName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{t.jalaliDate}</span>
                        <span>•</span>
                        <span>{t.type === 'income' ? 'درآمد' : t.type === 'expense' ? 'هزینه' : 'انتقال'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <span className={`text-xs font-black ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency, isFa)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Family Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div 
            className="fixed inset-0"
            onClick={() => setIsMemberModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{editingMember ? (isFa ? 'ویرایش عضو خانواده' : 'Edit Member') : (isFa ? 'افتتاح حساب برای عضو جدید خانواده' : 'Add Family Member')}</span>
              </h3>
              <button 
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'نام و نام خانوادگی عضو خانواده' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? 'مثال: سارا، رضا، همسر...' : 'e.g. Sara, Reza...'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'نسبت در خانواده' : 'Family Role'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['spouse', 'child', 'parent'] as FamilyRole[]).map((r, idx) => (
                    <button
                      key={`fm-role-${r}-${idx}`}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        role === r
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {r === 'spouse' ? (isFa ? 'همسر' : 'Spouse') : r === 'child' ? (isFa ? 'فرزند' : 'Child') : (isFa ? 'والدین' : 'Parent')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Character Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'کاراکتر گرافیکی و تصویر عضو' : 'Graphic Character & Avatar'}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <GraphicCharacterPicker
                    selectedId={avatar}
                    onSelect={(id) => setAvatar(id)}
                    language={language}
                  />
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'رنگ تم اختصاصی' : 'Color Theme'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c, idx) => (
                    <button
                      key={`fm-color-${c}-${idx}`}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition-all cursor-pointer ${
                        color === c ? 'border-slate-900 dark:border-white scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Monthly Allowance Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'سقف هزینه یا پول توجیبی ماهانه (اختیاری)' : 'Monthly Allowance Limit (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: ۲,۰۰۰,۰۰۰"
                  value={monthlyAllowance}
                  onChange={(e) => setMonthlyAllowance(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'رمز ورود ۴ رقمی عضو (اختیاری برای امنیت)' : 'Security PIN (Optional)'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="مثال: ۱۲۳۴"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Allowed Bank Accounts */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isFa ? 'حساب‌های بانکی مجاز برای ثبت مخارج' : 'Permitted Accounts'}
                </label>
                <div className="space-y-1.5">
                  {accounts.map((acc, idx) => {
                    const isChecked = selectedAllowedAccounts.includes(acc.id);
                    return (
                      <label 
                        key={`fm-allow-acc-${acc.id}-${idx}`}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAllowedAccounts([...selectedAllowedAccounts, acc.id]);
                            } else {
                              setSelectedAllowedAccounts(selectedAllowedAccounts.filter(id => id !== acc.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{acc.name} ({formatCurrency(acc.balance, currency, isFa)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  {editingMember ? (isFa ? 'ذخیره تغییرات' : 'Save Changes') : (isFa ? 'افتتاح حساب و ایجاد لینک' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Access Modal (Shown when clicking "لینک و دسترسی") */}
      <FamilyMemberAccessModal
        member={memberAccessModalFor}
        onClose={() => setMemberAccessModalFor(null)}
      />
    </div>
  );
};
