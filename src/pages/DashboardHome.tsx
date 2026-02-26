import { useState } from 'react';
import { ChevronRight, ChevronLeft, Wallet, Banknote } from 'lucide-react';
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

    // Tab state for the History section
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

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

    // Sort items chronologically for the list
    const sortedExpenses = [...currentPeriodExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedIncomes = [...currentPeriodIncomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pull to Refresh state
    const [pullStart, setPullStart] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pull to Refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow pull-to-refresh when at the top of the page
        if (window.scrollY === 0) {
            setPullStart(e.targetTouches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pullStart) return;
        const currentY = e.targetTouches[0].clientY;
        const distance = currentY - pullStart;

        // Only allow pulling down
        if (distance > 0 && distance < 150) {
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 100) {
            // Threshold met, trigger reload
            setIsRefreshing(true);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            // Reset if threshold not met
            setPullDistance(0);
            setPullStart(0);
        }
    };

    return (
        <div
            className="space-y-8 relative pb-24 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${isRefreshing ? 60 : pullDistance}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="absolute top-[-50px] left-0 right-0 flex justify-center items-center opacity-50 transition-opacity">
                    <div className={`w-6 h-6 border-2 border-[#3D2B1F] border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }}></div>
                </div>
            )}

            {/* 年月切り替えヘッダー */}
            <div className="flex justify-between items-center bg-white rounded-full p-2 shadow-sm border border-[#3D2B1F]/5 max-w-xs mx-auto sticky top-0 z-20">
                <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F7F4F0] text-[#3D2B1F]/50 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="relative flex flex-col items-center justify-center cursor-pointer group px-4">
                    <span className="text-[10px] font-black opacity-40 -mb-1 group-hover:opacity-80 transition-opacity">{currentYear}年</span>
                    <span className="text-lg font-black tracking-tighter group-hover:text-[#3D2B1F]/70 transition-colors">{currentMonth + 1}月</span>
                    <input
                        type="month"
                        value={currentYear + "-" + String(currentMonth + 1).padStart(2, '0')}
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

            {/* 今月の取引履歴リスト */}
            <section className="bg-white rounded-[40px] p-6 sm:p-8 shadow-sm border border-[#3D2B1F]/5">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-sm">{currentMonth + 1}月の取引一覧</h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Monthly Transactions</p>
                    </div>
                    <button onClick={() => navigate('/transactions')} className="text-[#3D2B1F]/40 hover:text-[#3D2B1F] flex items-center text-xs font-bold transition-colors">
                        すべて見る <ChevronRight size={14} className="ml-1" />
                    </button>
                </div>

                {/* 切り替えタブ */}
                <div className="flex bg-[#F7F4F0] p-1.5 rounded-2xl mb-6 relative">
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all z-10 ${activeTab === 'expense' ? 'text-[#3D2B1F] shadow-sm bg-white' : 'text-[#3D2B1F]/40'}`}
                    >
                        <Wallet size={14} className="mr-2" /> 経費
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all z-10 ${activeTab === 'income' ? 'text-[#3D2B1F] shadow-sm bg-white' : 'text-[#3D2B1F]/40'}`}
                    >
                        <Banknote size={14} className="mr-2" /> 収入
                    </button>
                </div>

                {/* リスト部分（スクロール可能） */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'expense' && (
                        <>
                            {sortedExpenses.length === 0 ? (
                                <p className="text-sm text-[#3D2B1F]/40 text-center py-10 font-bold">まだ経費がありません</p>
                            ) : (
                                sortedExpenses.map((e) => (
                                    <LogItem
                                        key={`exp-${e.id}`}
                                        name={e.store}
                                        date={e.date}
                                        amount={`-¥${e.amount.toLocaleString()}`}
                                        category={e.category}
                                        onClick={() => onOpenEntry?.("default", { ...e, transactionType: '支出' })}
                                    />
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'income' && (
                        <>
                            {sortedIncomes.length === 0 ? (
                                <p className="text-sm text-[#3D2B1F]/40 text-center py-10 font-bold">まだ収入がありません</p>
                            ) : (
                                sortedIncomes.map((i) => (
                                    <LogItem
                                        key={`inc-${i.id}`}
                                        name={i.client}
                                        date={i.date}
                                        amount={`+¥${i.amount.toLocaleString()}`}
                                        isIncome
                                        category="売上"
                                        withholding={i.withholding}
                                        onClick={() => onOpenEntry?.("default", { ...i, transactionType: '収入' })}
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            </section>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 4px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #D4D4D4; }
            `}} />
        </div >
    );
};

// サブコンポーネント
function LogItem({ name, date, amount, isIncome, category, withholding, onClick }: any) {
    return (
        <div onClick={onClick} className="flex justify-between items-center p-4 bg-[#F7F4F0]/30 hover:bg-[#F7F4F0] border border-[#3D2B1F]/5 group cursor-pointer transition-colors rounded-2xl">
            <div className="flex items-center space-x-4">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isIncome ? 'bg-emerald-500' : 'bg-[#3D2B1F]/20'}`}></div>
                <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-[#3D2B1F] truncate max-w-[120px] sm:max-w-xs">{name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <p className="text-[10px] opacity-40 font-bold tracking-widest whitespace-nowrap">
                            {date}
                        </p>
                        {category && (
                            <span className="text-[9px] font-black opacity-40 tracking-tight bg-[#3D2B1F]/5 px-1.5 rounded-sm whitespace-nowrap">
                                {category}
                            </span>
                        )}
                        {isIncome && withholding > 0 && (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 rounded-sm whitespace-nowrap border border-rose-100/50">
                                源泉徴収: ¥{withholding.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <p className={`text-base font-black tracking-tighter shrink-0 ml-2 ${isIncome ? 'text-emerald-700' : 'text-[#3D2B1F]'}`}>{amount}</p>
        </div>
    );
}

export default DashboardHome;
