import { useState } from 'react';
import { Key, CalendarDays, Plus, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Settings = () => {
    const { apiKey, setApiKey, fixedExpenses, setFixedExpenses, categories, expenses, incomes } = useAppContext();
    const [inputKey, setInputKey] = useState(apiKey);
    const [isSaved, setIsSaved] = useState(false);

    // New fixed expense state
    const [newFixedStore, setNewFixedStore] = useState('');
    const [newFixedAmount, setNewFixedAmount] = useState('');
    const [newFixedDay, setNewFixedDay] = useState(25);
    const [newFixedCategory, setNewFixedCategory] = useState('other');
    const [newFixedRatio, setNewFixedRatio] = useState(100);

    const handleSaveKey = () => {
        setApiKey(inputKey);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleAddFixedExpense = () => {
        if (!newFixedStore || !newFixedAmount) return;

        const newExpense = {
            id: Date.now(),
            store: newFixedStore,
            amount: parseInt(newFixedAmount, 10),
            day: newFixedDay,
            category: newFixedCategory,
            ratio: newFixedRatio
        };

        setFixedExpenses([...fixedExpenses, newExpense]);
        setNewFixedStore('');
        setNewFixedAmount('');
        setNewFixedDay(25);
        setNewFixedCategory('other');
        setNewFixedRatio(100);
    };

    const handleRemoveFixedExpense = (id: number) => {
        setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
    };

    const handleExportCSV = () => {
        // Headers (standard for tax accounting)
        const headers = ['日付', '収支区分', '勘定科目', '取引先/摘要', '金額', '事業割合(%)', '実質金額(円)', 'メモ'].join(',');

        // Map expenses
        const expensesCsv = expenses.map(e => {
            const date = e.date;
            const type = '支出';
            const category = categories.find(c => c.id === e.category)?.label || '不明';
            const store = e.store.replace(/,/g, '，'); // replace commas to prevent csv breaking
            const amount = e.amount;
            const ratio = e.ratio ?? 100;
            const effectiveAmount = Math.round((amount * ratio) / 100);
            const memo = (e.memo || '').replace(/,/g, '，').replace(/\n/g, ' ');
            return [date, type, category, store, amount, ratio, effectiveAmount, memo].join(',');
        });

        // Map incomes
        const incomesCsv = incomes.map(i => {
            const date = i.date;
            const type = '収入';
            const category = '売上高';
            const client = i.client.replace(/,/g, '，');
            const amount = i.amount;
            const ratio = 100;
            const effectiveAmount = amount;
            const memo = (i.memo || '').replace(/,/g, '，').replace(/\n/g, ' ');
            return [date, type, category, client, amount, ratio, effectiveAmount, memo].join(',');
        });

        const allRows = [...expensesCsv, ...incomesCsv];
        // Sort by date ascending
        allRows.sort((a, b) => {
            const dateA = a.split(',')[0];
            const dateB = b.split(',')[0];
            return dateA.localeCompare(dateB);
        });

        const csvContent = [headers, ...allRows].join('\n');

        // Add BOM for Excel UTF-8 support
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const filename = `takishima-expense_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-8 text-[#3D2B1F]">
            <header className="px-2">
                <h2 className="text-2xl font-black italic tracking-tighter">設定</h2>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Settings</p>
            </header>

            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[#F7F4F0] bg-[#F7F4F0]/30 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#3D2B1F] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm">連携</h3>
                        <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase">API Integration</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold opacity-50 uppercase tracking-widest">Anthropic API Key</label>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <input
                                type="password"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder="sk-ant-..."
                                className="flex-1 px-6 py-4 bg-[#F7F4F0] border-2 border-transparent rounded-[24px] focus:border-[#3D2B1F]/10 outline-none text-sm font-bold transition-all placeholder:text-[#3D2B1F]/30"
                            />
                            <button
                                onClick={handleSaveKey}
                                className={`px-8 py-4 rounded-[24px] font-black text-sm transition-all shadow-xl ${isSaved ? 'bg-emerald-600 text-white' : 'bg-[#3D2B1F] text-white hover:bg-black hover:-translate-y-1'}`}
                            >
                                {isSaved ? '保存完了' : '保存'}
                            </button>
                        </div>
                        <p className="text-[10px] font-bold opacity-40 leading-relaxed pt-2">
                            領収書や請求書のAI読み取り機能を使用するために設定します。APIキーはお使いのブラウザ内にのみ保存され、外部サーバに送信されることはありません（直接AnthropicAPIへリクエストします）。
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[#F7F4F0] bg-[#F7F4F0]/30 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#3D2B1F] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm">固定費</h3>
                        <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase">Fixed Expenses</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <p className="text-xs font-bold leading-relaxed opacity-60">
                        家賃や継続課金など、毎月発生する経費を設定すると、その月に初めてアクセスした時に自動登録されます。
                    </p>

                    {fixedExpenses.length > 0 && (
                        <div className="space-y-2">
                            {fixedExpenses.map(expense => (
                                <div key={expense.id} className="flex justify-between items-center p-5 bg-[#F7F4F0]/50 rounded-[24px] group hover:bg-[#F7F4F0] transition-colors">
                                    <div className="min-w-0 pr-4">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <span className="font-black text-sm">{expense.store}</span>
                                            <span className="text-[9px] bg-[#3D2B1F] text-white px-2 py-0.5 rounded-md font-bold shrink-0">毎月 {expense.day}日</span>
                                        </div>
                                        <div className="flex flex-wrap text-[10px] font-bold opacity-40 gap-x-4 gap-y-1 mt-2">
                                            <span className="text-[#3D2B1F] opacity-100">¥{expense.amount.toLocaleString()}</span>
                                            <span className="truncate">按分: {expense.ratio}%</span>
                                            <span className="truncate">{categories.find(c => c.id === expense.category)?.label || '不明'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFixedExpense(expense.id)}
                                        className="p-3 text-rose-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-[#F7F4F0]/30 rounded-[32px] p-6 lg:p-8">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-6 text-center">
                            新規登録
                        </h4>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newFixedStore}
                                onChange={(e) => setNewFixedStore(e.target.value)}
                                placeholder="支払先 (例：オフィス家賃, Adobe)"
                                className="w-full bg-white px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#3D2B1F]/5 placeholder:text-[#3D2B1F]/30"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">金額</label>
                                    <input
                                        type="number"
                                        value={newFixedAmount}
                                        onChange={(e) => setNewFixedAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-white px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#3D2B1F]/5 placeholder:text-[#3D2B1F]/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">発生日 (毎月)</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={newFixedDay}
                                        onChange={(e) => setNewFixedDay(parseInt(e.target.value) || 1)}
                                        className="w-full bg-white px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#3D2B1F]/5 text-center"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">事業按分 (%)</label>
                                    <input
                                        type="number"
                                        min="1" max="100"
                                        value={newFixedRatio}
                                        onChange={(e) => setNewFixedRatio(parseInt(e.target.value) || 100)}
                                        className="w-full bg-white px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#3D2B1F]/5 text-center"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">カテゴリ</label>
                                    <select
                                        value={newFixedCategory}
                                        onChange={(e) => setNewFixedCategory(e.target.value)}
                                        className="w-full bg-white px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#3D2B1F]/5 appearance-none text-center"
                                    >
                                        {categories.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddFixedExpense}
                            disabled={!newFixedStore || !newFixedAmount}
                            className={`w-full py-4 mt-8 rounded-[24px] font-black text-sm transition-all shadow-xl flex items-center justify-center ${newFixedStore && newFixedAmount ? 'bg-[#3D2B1F] text-white hover:bg-black hover:-translate-y-1' : 'bg-[#3D2B1F]/5 text-[#3D2B1F]/30 cursor-not-allowed shadow-none'}`}
                        >
                            <Plus size={18} className="mr-2" /> 追加する
                        </button>
                    </div>
                </div>
            </div>

            {/* CSV Export Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 overflow-hidden mt-6">
                <div className="px-8 py-6 border-b border-[#F7F4F0] bg-[#F7F4F0]/30 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#3D2B1F] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                        <FileSpreadsheet size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm">データ出力</h3>
                        <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase">Export Data</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-xs font-bold leading-relaxed opacity-60">
                        確定申告ソフト（マネーフォワード、freee、弥生など）やExcelで読み込めるCSV形式で、全ての取引データをダウンロードします。
                    </p>

                    <button
                        onClick={handleExportCSV}
                        className="w-full sm:w-auto px-8 py-4 rounded-[24px] font-black text-sm transition-all shadow-xl bg-[#3D2B1F] text-white hover:bg-black hover:-translate-y-1 flex items-center justify-center"
                    >
                        <Download size={18} className="mr-2" /> CSVファイルをダウンロード
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Settings;
