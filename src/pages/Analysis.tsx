import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useAppContext } from '../contexts/AppContext';
import { X, Wallet, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Analysis = () => {
    const { expenses, incomes, setEditTransaction } = useAppContext();
    const navigate = useNavigate();

    // Determine available years from data, default to current year
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        incomes.forEach(i => years.add(i.date.substring(0, 4)));
        expenses.forEach(e => years.add(e.date.substring(0, 4)));
        const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
        if (sortedYears.length === 0) sortedYears.push(new Date().getFullYear().toString());
        return sortedYears;
    }, [incomes, expenses]);

    const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

    // Drill-down Modal State
    const [detailModalType, setDetailModalType] = useState<'income' | 'expense' | null>(null);

    // Filter data by selected year
    const filteredIncomes = useMemo(() => incomes.filter(i => i.date.startsWith(selectedYear)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomes, selectedYear]);
    const filteredExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedYear)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses, selectedYear]);

    const monthlyData = useMemo(() => {
        const dataMap: Record<string, { month: string; income: number; expense: number }> = {};

        // Initialize all 12 months for the selected year
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            const key = `${selectedYear}-${monthStr}`;
            dataMap[key] = { month: `${i}月`, income: 0, expense: 0 };
        }

        filteredIncomes.forEach(i => {
            const key = i.date.substring(0, 7);
            if (dataMap[key]) dataMap[key].income += i.amount;
        });

        filteredExpenses.forEach(e => {
            const key = e.date.substring(0, 7);
            if (dataMap[key]) dataMap[key].expense += e.amount;
        });

        // Return chronological order
        return Object.keys(dataMap).sort().map(key => dataMap[key]);
    }, [filteredExpenses, filteredIncomes, selectedYear]);

    // Calculate annual totals for the selected year
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalProfit = totalIncome - totalExpense;

    // Category breakdown for the selected year
    const categoryData = useMemo(() => {
        const dataMap: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            const cat = e.category && e.category.trim() !== '' ? e.category : '未分類';
            dataMap[cat] = (dataMap[cat] || 0) + e.amount;
        });
        return Object.entries(dataMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses]);


    const handleOpenDetailModal = (type: 'income' | 'expense') => {
        setDetailModalType(type);
    };

    const handleTransactionClick = (transaction: any, type: '収入' | '支出') => {
        setEditTransaction({ ...transaction, transactionType: type });
        setDetailModalType(null); // Close modal
        navigate('/transactions'); // Ensure we are on the transactions page to see the form
    };

    return (
        <div className="space-y-6 pb-24 text-[#3D2B1F] relative">
            {/* Header with Year Selector */}
            <header className="px-2 flex justify-between items-end sticky top-0 bg-[#F7F4F0]/90 backdrop-blur-md z-10 py-4 -mt-4 border-b border-[#3D2B1F]/5">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">分析・レポート</h2>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Analytics</p>
                </div>
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none bg-white border border-[#3D2B1F]/10 text-[#3D2B1F] font-black text-sm rounded-full px-6 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#3D2B1F]/50">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </header>

            {/* Total Summaries (Clickable) */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    onClick={() => handleOpenDetailModal('income')}
                    className="bg-[#3D2B1F] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
                >
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">売上合計 ({selectedYear}年)</p>
                        <Banknote size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tighter">¥{totalIncome.toLocaleString()}</p>
                    <p className="text-[10px] opacity-30 mt-2 font-bold group-hover:opacity-80 transition-opacity">詳細を見る →</p>
                    <div className="absolute right-[-20%] top-[-20%] w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                </div>
                <div
                    onClick={() => handleOpenDetailModal('expense')}
                    className="bg-white border border-[#3D2B1F]/5 rounded-[32px] p-6 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
                >
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">経費合計 ({selectedYear}年)</p>
                        <Wallet size={14} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tighter">¥{totalExpense.toLocaleString()}</p>
                    <p className="text-[10px] opacity-20 mt-2 font-bold group-hover:opacity-80 transition-opacity">詳細を見る →</p>
                </div>
            </div>

            {/* Profit Card */}
            <div className="bg-[#F7F4F0]/50 rounded-[32px] p-6 border-2 border-white text-center shadow-sm">
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">総利益 ({selectedYear}年)</p>
                <p className={`text-4xl sm:text-5xl font-black tracking-tight ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalProfit >= 0 ? '+' : '-'}¥{Math.abs(totalProfit).toLocaleString()}
                </p>
            </div>

            {/* Charts Section */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 overflow-hidden">
                <div className="p-6 bg-[#F7F4F0]/30 border-b border-[#3D2B1F]/5">
                    <h3 className="font-black text-sm">月別推移 ({selectedYear}年)</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Monthly Trajectory</p>
                </div>

                <div className="p-6 pt-10 pb-8 h-[350px]">
                    {monthlyData.every(d => d.income === 0 && d.expense === 0) ? (
                        <div className="h-full flex items-center justify-center text-sm font-bold opacity-40">
                            データがありません
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#3D2B1F', opacity: 0.5 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#3D2B1F', opacity: 0.5 }}
                                    tickFormatter={(val) => `¥${val.toLocaleString()}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F7F4F0', opacity: 0.5 }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(61,43,31,0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                                    formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '']}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', bottom: -10 }} iconType="circle" />
                                <Bar dataKey="income" name="売上" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="経費" fill="#3D2B1F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 overflow-hidden">
                <div className="p-6 bg-[#F7F4F0]/30 border-b border-[#3D2B1F]/5">
                    <h3 className="font-black text-sm">経費カテゴリ内訳 ({selectedYear}年)</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Expense Breakdown</p>
                </div>
                <div className="p-6">
                    {categoryData.length === 0 ? (
                        <div className="text-sm font-bold opacity-40 text-center py-8">データがありません</div>
                    ) : (
                        <div className="space-y-6">
                            {categoryData.map((data, index) => {
                                const percentage = totalExpense > 0 ? Math.round((data.value / totalExpense) * 100) : 0;
                                return (
                                    <div key={index} className="space-y-2 group">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#3D2B1F] opacity-70"></span>
                                                {data.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-black">¥{data.value.toLocaleString()}</span>
                                                <span className="text-[10px] font-bold opacity-40 ml-2 w-8 inline-block text-right">{percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#F7F4F0] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3D2B1F] rounded-full transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>


            {/* Details Modal */}
            {detailModalType && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-[#3D2B1F]/40 backdrop-blur-sm" onClick={() => setDetailModalType(null)}></div>
                    <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[75vh] sm:h-[600px] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in duration-300">
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-[#3D2B1F]/5 flex justify-between items-center bg-[#F7F4F0]/50">
                            <div>
                                <h3 className="font-black text-lg">
                                    {detailModalType === 'income' ? '売上' : '経費'}詳細 ({selectedYear}年)
                                </h3>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
                                    {detailModalType === 'income' ? 'Income' : 'Expense'} Details
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailModalType(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#3D2B1F]/10 text-[#3D2B1F]/50 hover:bg-[#3D2B1F] hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal List Content */}
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            <div className="space-y-1">
                                {detailModalType === 'income' ? (
                                    filteredIncomes.length === 0 ? (
                                        <p className="text-sm text-[#3D2B1F]/40 text-center py-10 font-bold">まだ売上がありません</p>
                                    ) : (
                                        filteredIncomes.map((i) => (
                                            <div
                                                key={`modal-inc-${i.id}`}
                                                onClick={() => handleTransactionClick(i, '収入')}
                                                className="flex justify-between items-center p-4 bg-white hover:bg-[#F7F4F0] rounded-2xl cursor-pointer transition-colors group"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#3D2B1F] truncate max-w-[150px]">{i.client}</p>
                                                        <p className="text-[10px] opacity-40 font-bold mt-1">{i.date}</p>
                                                    </div>
                                                </div>
                                                <p className="text-base font-black tracking-tighter text-emerald-700">+¥{i.amount.toLocaleString()}</p>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    filteredExpenses.length === 0 ? (
                                        <p className="text-sm text-[#3D2B1F]/40 text-center py-10 font-bold">まだ経費がありません</p>
                                    ) : (
                                        filteredExpenses.map((e) => (
                                            <div
                                                key={`modal-exp-${e.id}`}
                                                onClick={() => handleTransactionClick(e, '支出')}
                                                className="flex justify-between items-center p-4 bg-white hover:bg-[#F7F4F0] rounded-2xl cursor-pointer transition-colors group"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#3D2B1F]/20"></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#3D2B1F] truncate max-w-[150px]">{e.store}</p>
                                                        <p className="text-[10px] opacity-40 font-bold mt-1">
                                                            {e.date} {e.category && `• ${e.category}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-base font-black tracking-tighter text-[#3D2B1F]">-¥{e.amount.toLocaleString()}</p>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 4px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #D4D4D4; }
            `}} />
        </div>
    );
};

export default Analysis;
