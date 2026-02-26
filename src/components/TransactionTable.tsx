import { Trash2, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface TransactionTableProps {
    transactions?: any[];
    onOpenEntry?: (mode: "default" | "camera", initialData?: any) => void;
}

const TransactionTable = ({ transactions, onOpenEntry }: TransactionTableProps) => {
    const { expenses, incomes, deleteExpense, deleteIncome, loading } = useAppContext();

    // Use passed transactions or fall back to context data
    const allTransactions = transactions || [
        ...expenses.map(e => ({
            id: `exp-${e.id}`,
            realId: e.id,
            date: e.date,
            type: '支出',
            category: e.category,
            description: e.store,
            amount: Math.round((e.amount * (e.ratio ?? 100)) / 100), // Effective amount logic from App.jsx
            isPartial: (e.ratio ?? 100) < 100,
            originalData: { ...e, transactionType: '支出' }
        })),
        ...incomes.map(i => ({
            id: `inc-${i.id}`,
            realId: i.id,
            date: i.date,
            type: '収入',
            category: '売上',
            description: i.client,
            amount: i.amount,
            withholding: i.withholding,
            isPartial: false,
            originalData: { ...i, transactionType: '収入' }
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = async (e: React.MouseEvent, type: string, id: number) => {
        e.stopPropagation();
        if (!window.confirm('本当に削除しますか？')) return;
        if (type === '支出') {
            await deleteExpense(id);
        } else {
            await deleteIncome(id);
        }
    };

    const handleRowClick = (t: any) => {
        if (onOpenEntry && t.originalData) {
            onOpenEntry("default", t.originalData);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10 text-[#3D2B1F]/30">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-[#3D2B1F]/5 min-h-[50vh]">
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-bold text-sm">全取引記録</h3>
                <span className="text-[10px] font-black opacity-30">{allTransactions.length}件</span>
            </div>

            <div className="space-y-4">
                {allTransactions.length === 0 ? (
                    <div className="text-center py-12 text-[#3D2B1F]/30 text-sm font-bold border-t border-[#F7F4F0] mt-4">
                        取引データがありません
                    </div>
                ) : (
                    Object.entries(allTransactions.reduce((acc, t) => {
                        const monthKey = t.date.substring(0, 7);
                        if (!acc[monthKey]) acc[monthKey] = [];
                        acc[monthKey].push(t);
                        return acc;
                    }, {} as Record<string, typeof allTransactions>))
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([monthKey, monthTrans]) => {
                            const [year, month] = monthKey.split('-');
                            return (
                                <div key={monthKey} className="mb-2">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-2 pl-2 border-b border-[#F7F4F0] pb-2 pt-4 first:pt-0">
                                        {year}年 {parseInt(month)}月
                                    </h4>
                                    <div className="space-y-1 divide-y divide-[#F7F4F0]">
                                        {(monthTrans as any[]).map((t: any) => (
                                            <div
                                                key={t.id}
                                                onClick={() => handleRowClick(t)}
                                                className={`flex justify-between items-center py-4 group px-3 -mx-3 rounded-2xl transition-colors gap-2 ${onOpenEntry ? 'cursor-pointer hover:bg-[#F7F4F0]/50' : ''}`}
                                            >
                                                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${t.type === '収入' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7F4F0] text-[#3D2B1F] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]'}`}>
                                                        {t.type === '収入' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                                    </div>
                                                    <div className="min-w-0 pr-2">
                                                        <div className="flex items-center space-x-2 flex-wrap">
                                                            <p className="text-sm font-bold truncate max-w-[120px] sm:max-w-xs">{t.description}</p>
                                                            <span className="text-[9px] font-black opacity-40 tracking-tight bg-[#F7F4F0] px-2 rounded-md mt-0.5 whitespace-nowrap">
                                                                {t.category}
                                                            </span>
                                                            {t.type === '支出' && t.originalData.ratio < 100 && (
                                                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 rounded-md mt-0.5 whitespace-nowrap border border-amber-100/50">
                                                                    按分: {t.originalData.ratio}%
                                                                </span>
                                                            )}
                                                            {t.type === '収入' && t.withholding > 0 && (
                                                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 rounded-md mt-0.5 whitespace-nowrap border border-rose-100/50">
                                                                    源泉徴収: ¥{t.withholding.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                                                            {t.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1 shrink-0 text-right justify-end ml-2">
                                                    <div className="mr-1">
                                                        <p className={`text-sm sm:text-base font-black tracking-tighter ${t.type === '収入' ? 'text-emerald-700' : 'text-[#3D2B1F]'}`}>
                                                            {t.type === '支出' ? '-' : ''}¥{t.amount?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDelete(e, t.type, t.realId)}
                                                        className="p-2 sm:p-2.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95 shrink-0 relative z-10"
                                                        title="削除"
                                                    >
                                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
};

export default TransactionTable;
