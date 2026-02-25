import { Camera, FileText, FilePlus, Pen, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

type DashboardHomeProps = {
    onOpenEntry?: () => void;
};

const DashboardHome = ({ onOpenEntry }: DashboardHomeProps) => {
    const { expenses, incomes } = useAppContext();

    // Calculate totals
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthIncomes = incomes.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthExpenses = expenses.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentMonthIncomeTotal = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const currentMonthExpenseTotal = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCurrentMonthStr = `¥${currentMonthExpenseTotal.toLocaleString()}`;

    // Recent items
    const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const recentIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);

    return (
        <div className="space-y-10 relative">
            {/* ブラウンのメインカード */}
            <section className="bg-[#3D2B1F] rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                <p className="text-xs font-bold opacity-40 mb-2 tracking-widest">今月の経費合計</p>
                <h2 className="text-6xl font-black tracking-tighter italic">{totalCurrentMonthStr}</h2>
                <div className="flex flex-wrap gap-3 mt-8 relative z-10">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <p className="text-[10px] opacity-40 font-bold mb-0.5">当月収入</p>
                        <p className="text-sm font-black">¥{currentMonthIncomeTotal.toLocaleString()}</p>
                    </div>
                </div>
                {/* Decorative element */}
                <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            </section>

            {/* クイック追加 */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 ml-4">クイック追加</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickBtn icon={<Camera size={22} />} label="画像読込" onClick={onOpenEntry} />
                    <QuickBtn icon={<FileText size={22} />} label="PDF読込" onClick={onOpenEntry} />
                    <QuickBtn icon={<FilePlus size={22} />} label="請求書作成" onClick={() => window.location.href = '/invoices'} />
                    <QuickBtn icon={<Pen size={22} />} label="手入力" onClick={onOpenEntry} />
                </div>
            </section>

            {/* 最近の記録 */}
            <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#3D2B1F]/5">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="font-bold text-sm">最近の記録</h3>
                    <ChevronRight size={16} className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
                <div className="space-y-1 divide-y divide-[#F7F4F0]">
                    {recentExpenses.map((e) => (
                        <LogItem key={`exp-${e.id}`} name={e.store} date={e.date} amount={`-¥${e.amount.toLocaleString()}`} category={e.category} />
                    ))}
                    {recentIncomes.map((i) => (
                        <LogItem key={`inc-${i.id}`} name={i.client} date={i.date} amount={`+¥${i.amount.toLocaleString()}`} isIncome category="売上" />
                    ))}
                    {recentExpenses.length === 0 && recentIncomes.length === 0 && (
                        <p className="text-sm text-[#3D2B1F]/40 text-center py-8">まだデータがありません</p>
                    )}
                </div>
                <div className="mt-6 text-center">
                    <button onClick={() => window.location.href = '/transactions'} className="inline-block text-[10px] font-black uppercase tracking-widest text-[#3D2B1F]/30 hover:text-[#3D2B1F] transition-colors underline decoration-dotted underline-offset-4">
                        View All
                    </button>
                </div>
            </section>
        </div>
    );
};

// サブコンポーネント
function QuickBtn({ icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className="bg-white p-6 rounded-[32px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center group">
            <div className="w-12 h-12 bg-[#F7F4F0] text-[#3D2B1F]/40 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#3D2B1F] group-hover:text-white transition-all">
                {icon}
            </div>
            <span className="text-[11px] font-black tracking-tighter">{label}</span>
        </button>
    );
}

function LogItem({ name, date, amount, isIncome, category }: any) {
    return (
        <div className="flex justify-between items-center py-4 group cursor-pointer transition-colors hover:bg-[#F7F4F0]/50 px-3 -mx-3 rounded-2xl">
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
