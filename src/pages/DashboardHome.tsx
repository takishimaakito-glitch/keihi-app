import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface DashboardHomeProps {
    onOpenEntry?: (mode: "default" | "camera", initialData?: any) => void;
}

const DashboardHome = ({ onOpenEntry }: DashboardHomeProps) => {
    const { expenses, incomes } = useAppContext();
    const navigate = useNavigate();

    // Date navigation state
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const handlePrevMonth = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const handleNextMonth = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    // Calculate totals for selected period
    const currentPeriodIncomes = incomes.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentPeriodExpenses = expenses.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentIncomeTotal = currentPeriodIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const currentExpenseTotal = currentPeriodExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Recent items
    const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const recentIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);

    return (
        <div className="space-y-8 relative">

            {/* 年月切り替えヘッダー */}
            <div className="flex justify-between items-center bg-white rounded-full p-2 shadow-sm border border-[#3D2B1F]/5 max-w-xs mx-auto">
                <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F7F4F0] text-[#3D2B1F]/50 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="relative flex flex-col items-center justify-center cursor-pointer group px-4">
                    <span className="text-[10px] font-black opacity-40 -mb-1 group-hover:opacity-80 transition-opacity">{currentYear}年</span>
                    <span className="text-lg font-black tracking-tighter group-hover:text-[#3D2B1F]/70 transition-colors">{currentMonth + 1}月</span>
                    <input
                        type="month"
                        value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                            if (e.target.value) {
                                setSelectedDate(new Date(e.target.value + "-01T00:00:00"));
                            }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F7F4F0] text-[#3D2B1F]/50 transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* ブラウンのメインカード */}
            <section className="bg-[#3D2B1F] rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                <p className="text-xs font-bold opacity-40 mb-2 tracking-widest">{currentMonth + 1}月の経費合計</p>
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter italic overflow-hidden text-ellipsis">
                    ¥{currentExpenseTotal.toLocaleString()}
                </h2>
                <div className="flex flex-wrap gap-3 mt-8 relative z-10">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <p className="text-[10px] opacity-40 font-bold mb-0.5">{currentMonth + 1}月売上</p>
                        <p className="text-sm font-black">¥{currentIncomeTotal.toLocaleString()}</p>
                    </div>
                </div>
                {/* Decorative element */}
                <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            </section>


            {/* 最近の記録 */}
            <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#3D2B1F]/5">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="font-bold text-sm">最近の記録</h3>
                    <ChevronRight size={16} className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
                <div className="space-y-1 divide-y divide-[#F7F4F0]">
                    {recentExpenses.map((e) => (
                        <LogItem key={`exp-${e.id}`} name={e.store} date={e.date} amount={`-¥${e.amount.toLocaleString()}`} category={e.category} onClick={() => onOpenEntry?.("default", { ...e, transactionType: '支出' })} />
                    ))}
                    {recentIncomes.map((i) => (
                        <LogItem key={`inc-${i.id}`} name={i.client} date={i.date} amount={`+¥${i.amount.toLocaleString()}`} isIncome category="売上" onClick={() => onOpenEntry?.("default", { ...i, transactionType: '収入' })} />
                    ))}
                    {recentExpenses.length === 0 && recentIncomes.length === 0 && (
                        <p className="text-sm text-[#3D2B1F]/40 text-center py-8">まだデータがありません</p>
                    )}
                </div>
                <div className="mt-8 text-center">
                    <button onClick={() => navigate('/transactions')} className="inline-block px-10 py-3 rounded-full bg-[#F7F4F0] text-[10px] font-black uppercase tracking-widest text-[#3D2B1F]/50 hover:bg-[#3D2B1F] hover:text-white transition-all">
                        View All
                    </button>
                </div>
            </section>
        </div>
    );
};

// サブコンポーネント
function LogItem({ name, date, amount, isIncome, category, onClick }: any) {
    return (
        <div onClick={onClick} className="flex justify-between items-center py-4 group cursor-pointer transition-colors hover:bg-[#F7F4F0]/50 px-3 -mx-3 rounded-2xl">
            <div className="flex items-center space-x-4">
                <div className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-[#3D2B1F]/20'}`}></div>
                <div>
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold">{name}</p>
                    </div>
                    <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                        {date}  {category && `• ${category}`}
                    </p>
                </div>
            </div>
            <p className={`text-sm font-black tracking-tighter ${isIncome ? 'text-emerald-700' : 'text-[#3D2B1F]'}`}>{amount}</p>
        </div>
    );
}

export default DashboardHome;
