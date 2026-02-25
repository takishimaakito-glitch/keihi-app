import { Trash2, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const TransactionTable = () => {
    const { expenses, incomes, deleteExpense, deleteIncome, loading } = useAppContext();

    // Combine and sort both lists
    const allTransactions = [
        ...expenses.map(e => ({
            id: `exp-${e.id}`,
            realId: e.id,
            date: e.date,
            type: '支出',
            category: e.category,
            description: e.store,
            amount: Math.round((e.amount * (e.ratio ?? 100)) / 100), // Effective amount logic from App.jsx
            isPartial: (e.ratio ?? 100) < 100
        })),
        ...incomes.map(i => ({
            id: `inc-${i.id}`,
            realId: i.id,
            date: i.date,
            type: '収入',
            category: '売上',
            description: i.client,
            amount: i.amount,
            isPartial: false
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = async (type: string, id: number) => {
        if (!window.confirm('本当に削除しますか？')) return;
        if (type === '支出') {
            await deleteExpense(id);
        } else {
            await deleteIncome(id);
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

            <div className="space-y-1 divide-y divide-[#F7F4F0]">
                {allTransactions.length === 0 ? (
                    <div className="text-center py-12 text-[#3D2B1F]/30 text-sm font-bold">
                        取引データがありません
                    </div>
                ) : allTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center py-4 group px-3 -mx-3 rounded-2xl hover:bg-[#F7F4F0]/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${t.type === '収入' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7F4F0] text-[#3D2B1F] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]'}`}>
                                {t.type === '収入' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-bold truncate max-w-[120px] sm:max-w-xs">{t.description}</p>
                                    <span className="text-[9px] font-black opacity-30 tracking-tight bg-[#F7F4F0] px-2 py-0.5 rounded-md">
                                        {t.category}
                                    </span>
                                </div>
                                <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                                    {t.date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-right">
                            <div>
                                <p className={`text-base font-black tracking-tighter ${t.type === '収入' ? 'text-emerald-700' : 'text-[#3D2B1F]'}`}>
                                    {t.type === '支出' ? '-' : ''}¥{t.amount.toLocaleString()}
                                </p>
                                {t.isPartial && <span className="block text-[8px] opacity-40 font-bold -mt-1 hidden">按分済</span>}
                            </div>
                            <button
                                onClick={() => handleDelete(t.type, t.realId)}
                                className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                title="削除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionTable;
