import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarDays, CalendarRange, TrendingUp } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const BalanceChart = () => {
    const { expenses, incomes } = useAppContext();
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const chartData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        if (viewMode === 'monthly') {
            // Aggregate last 6 months
            const dataMap = new Map();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getMonth() + 1}月`;
                dataMap.set(key, { name: key, 収入: 0, 支出: 0, year: d.getFullYear(), month: d.getMonth() });
            }

            incomes.forEach(inc => {
                const d = new Date(inc.date);
                const key = `${d.getMonth() + 1}月`;
                if (dataMap.has(key) && dataMap.get(key).year === d.getFullYear() && dataMap.get(key).month === d.getMonth()) {
                    dataMap.get(key).収入 += inc.amount;
                }
            });

            expenses.forEach(exp => {
                const d = new Date(exp.date);
                const key = `${d.getMonth() + 1}月`;
                if (dataMap.has(key) && dataMap.get(key).year === d.getFullYear() && dataMap.get(key).month === d.getMonth()) {
                    const effectiveAmount = Math.round((exp.amount * (exp.ratio ?? 100)) / 100);
                    dataMap.get(key).支出 += effectiveAmount;
                }
            });

            return Array.from(dataMap.values());
        } else {
            // Aggregate last 4 years
            const dataMap = new Map();
            for (let i = 3; i >= 0; i--) {
                const year = currentYear - i;
                const key = `${year}年`;
                dataMap.set(key, { name: key, 収入: 0, 支出: 0, year });
            }

            incomes.forEach(inc => {
                const year = new Date(inc.date).getFullYear();
                const key = `${year}年`;
                if (dataMap.has(key)) {
                    dataMap.get(key).収入 += inc.amount;
                }
            });

            expenses.forEach(exp => {
                const year = new Date(exp.date).getFullYear();
                const key = `${year}年`;
                if (dataMap.has(key)) {
                    const effectiveAmount = Math.round((exp.amount * (exp.ratio ?? 100)) / 100);
                    dataMap.get(key).支出 += effectiveAmount;
                }
            });

            return Array.from(dataMap.values());
        }
    }, [expenses, incomes, viewMode]);

    const currentData = chartData;
    const mainColor = "#164e63";
    const subColor = "#e2e8f0";

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                        <TrendingUp size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Analytics</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">収支推移レポート</h4>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setViewMode('monthly')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <CalendarDays size={16} className="mr-2" />月別
                    </button>
                    <button onClick={() => setViewMode('yearly')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <CalendarRange size={16} className="mr-2" />年別
                    </button>
                </div>
            </div>
            <div className="flex space-x-6 mb-6">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                    <div className="w-3 h-3 bg-emerald-900 rounded-full mr-2"></div>収入（売上）
                </div>
                <div className="flex items-center text-xs text-slate-500 font-medium">
                    <div className="w-3 h-3 bg-slate-200 rounded-full mr-2"></div>支出（経費）
                </div>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `¥${(value / 10000).toLocaleString()}万`} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} formatter={(value: any) => [`¥${value.toLocaleString()}`, '']} />
                        <Bar dataKey="収入" fill={mainColor} radius={[6, 6, 0, 0]} barSize={viewMode === 'monthly' ? 24 : 40} />
                        <Bar dataKey="支出" fill={subColor} radius={[6, 6, 0, 0]} barSize={viewMode === 'monthly' ? 24 : 40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50">
                <p className="text-xs text-slate-400 flex items-center justify-end italic">
                    ※ {viewMode === 'monthly' ? '直近6ヶ月' : '過去4年間'}のデータを表示しています。
                </p>
            </div>
        </div>
    );
};

export default BalanceChart;
