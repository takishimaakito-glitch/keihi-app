import { useState, useRef, useEffect } from 'react';
import { X, Loader2, Sparkles, ArrowRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { Expense, Income } from '../contexts/AppContext';

// === お気に入り（いつものセット）のモックデータ ===
const FAVORITES = [
    { label: 'スタバ', icon: '☕️', category: 'food', store: 'スターバックスコーヒー', memo: '打ち合わせカフェ代' },
    { label: 'タクシー', icon: '🚕', category: 'travel', store: 'GOタクシー', memo: '移動交通費' },
    { label: 'Amazon', icon: '📦', category: 'supplies', store: 'Amazon.co.jp', memo: '事務用品' },
    { label: 'ランチ', icon: '🍱', category: 'food', store: 'コンビニ', memo: '昼食代' },
];

export type EditTransactionData = (Expense & { transactionType: '支出' }) | (Income & { transactionType: '収入' });

const TransactionForm = ({ onClose, initialMode = "default", initialData }: { onClose?: () => void; initialMode?: "default" | "camera"; initialData?: EditTransactionData | null }) => {
    const { addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, apiKey, categories } = useAppContext();

    const [type, setType] = useState<'支出' | '収入'>(initialData ? initialData.transactionType : '支出');
    const [date, setDate] = useState(initialData ? initialData.date : new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
    const [category, setCategory] = useState(initialData && initialData.transactionType === '支出' ? initialData.category : '');
    const [clientStore, setClientStore] = useState(initialData ? (initialData.transactionType === '支出' ? initialData.store : initialData.client) : '');
    const [memo, setMemo] = useState(initialData?.memo || '');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // AI OCR States
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Automatically trigger camera scan if opened via Quick Add
    useEffect(() => {
        if (initialMode === "camera") {
            const timer = setTimeout(() => {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [initialMode]);

    const applyFavorite = (fav: typeof FAVORITES[0]) => {
        setCategory(fav.category);
        setClientStore(fav.store);
        setMemo(fav.memo);
        // 金額は手入力のために空けておくことが多いので据え置き、またはフォーカス
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsScanning(true);

        try {
            if (!apiKey) {
                throw new Error("APIキーが設定されていません。設定画面からAnthropic APIキーを登録してください。");
            }

            const base64 = await new Promise<string>((res, rej) => {
                const r = new FileReader();
                r.onload = () => {
                    const result = r.result as string;
                    res(result.split(",")[1]);
                };
                r.onerror = rej;
                r.readAsDataURL(file);
            });

            // Determine Media Type
            let mediaType = "image/jpeg";
            if (file.type === "image/png") mediaType = "image/png";
            else if (file.type === "image/webp") mediaType = "image/webp";
            else if (file.type === "application/pdf") mediaType = "application/pdf";

            const isExpense = type === '支出';
            const categoriesPrompt = isExpense
                ? `また、category には以下のいずれかのIDを指定してください。内容から判断できない場合は"other"にしてください。\n${categories.filter(c => c.id !== 'all').map(c => `- ${c.id} (${c.label}) ${c.keywords ? `キーワード: ${c.keywords}` : ''}`).join('\n')}`
                : '';

            const promptText = isExpense
                ? `この領収書/レシート画像から情報を抽出してJSONのみ返してください（前置き・説明不要）:
{
  "date": "YYYY-MM-DD",
  "store": "購入先・店舗名",
  "amount": 数値（税込合計金額）,
  "category": "指定されたカテゴリID",
  "memo": "購入内容の簡潔な説明"
}
${categoriesPrompt}`
                : `この請求書/領収書から情報を抽出してJSONのみ返してください（前置き・説明不要）:
{
  "date": "YYYY-MM-DD（請求日または支払日）",
  "client": "発注元の会社名・依頼主名",
  "amount": 数値（税込合計金額）,
  "withholding": 数値（源泉徴収税額、なければ0、推測不可な場合は0）,
  "memo": "業務内容の簡潔な説明"
}`;

            const resp = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1000,
                    messages: [{
                        role: "user",
                        content: [
                            {
                                type: "document",
                                source: { type: "base64", media_type: mediaType as any, data: base64 }
                            },
                            {
                                type: "text",
                                text: promptText
                            }
                        ]
                    }]
                })
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                console.error("API Error", errData);
                throw new Error(`AI読み取りに失敗しました: ${resp.status}`);
            }

            const data = await resp.json();
            const text = data.content?.map((i: any) => i.text || "").join("") || "";
            const clean = text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);

            if (parsed.date) setDate(parsed.date);
            if (parsed.amount) setAmount(parsed.amount.toString());
            if (parsed.memo) setMemo(parsed.memo);

            if (isExpense) {
                if (parsed.store) setClientStore(parsed.store);
                if (parsed.category) setCategory(parsed.category);
            } else {
                if (parsed.client) setClientStore(parsed.client);
            }

        } catch (err: any) {
            console.error("OCR Error:", err);
            setError(err.message || "読み取りに失敗しました。");
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || !category || !clientStore) {
            setError('金額、取引先、カテゴリは必須です。');
            return;
        }

        setIsSubmitting(true);
        try {
            if (type === '支出') {
                const expenseData = {
                    date,
                    amount: parseInt(amount, 10),
                    store: clientStore,
                    category,
                    memo
                };
                if (initialData && initialData.transactionType === '支出') {
                    const { error: submitError } = await updateExpense(initialData.id, expenseData);
                    if (submitError) throw submitError;
                } else {
                    const { error: submitError } = await addExpense(expenseData);
                    if (submitError) throw submitError;
                }
            } else {
                const incomeData = {
                    date,
                    amount: parseInt(amount, 10),
                    client: clientStore,
                    withholding: initialData && initialData.transactionType === '収入' ? initialData.withholding : 0,
                    memo
                };
                if (initialData && initialData.transactionType === '収入') {
                    const { error: submitError } = await updateIncome(initialData.id, incomeData);
                    if (submitError) throw submitError;
                } else {
                    const { error: submitError } = await addIncome(incomeData);
                    if (submitError) throw submitError;
                }
            }

            if (onClose) onClose();
            else {
                setAmount('');
                setClientStore('');
                setMemo('');
                alert('保存しました');
            }
        } catch (err: any) {
            setError(err.message || '保存に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;
        if (!window.confirm('本当に削除しますか？')) return;

        setIsSubmitting(true);
        try {
            if (initialData.transactionType === '支出') {
                await deleteExpense(initialData.id);
            } else {
                await deleteIncome(initialData.id);
            }
            if (onClose) onClose();
        } catch (err: any) {
            setError(err.message || '削除に失敗しました。');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-[85vh] text-[#3D2B1F]">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shrink-0">
                <div className="bg-[#F7F4F0] p-1 rounded-full flex relative">
                    <button
                        onClick={() => !initialData && setType('支出')}
                        disabled={!!initialData}
                        className={`px-6 py-2 rounded-full text-xs font-black transition-all ${type === '支出' ? 'bg-[#3D2B1F] text-white shadow-md' : 'text-[#3D2B1F]/40'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        支出
                    </button>
                    <button
                        onClick={() => !initialData && setType('収入')}
                        disabled={!!initialData}
                        className={`px-6 py-2 rounded-full text-xs font-black transition-all ${type === '収入' ? 'bg-[#3D2B1F] text-white shadow-md' : 'text-[#3D2B1F]/40'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        収入
                    </button>
                </div>
                <div className="flex space-x-2">
                    {initialData && (
                        <button onClick={handleDelete} className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button onClick={onClose} className="w-10 h-10 bg-[#F7F4F0] rounded-full flex items-center justify-center text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                        {error}
                    </div>
                )}

                {/* いつものセット (Favorites) */}
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3 px-2">いつものセットから入力</p>
                    <div className="flex space-x-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
                        {FAVORITES.map((fav, i) => (
                            <button
                                key={i}
                                onClick={() => applyFavorite(fav)}
                                className="shrink-0 flex items-center bg-white border-2 border-[#F7F4F0] px-4 py-3 rounded-[24px] hover:border-[#3D2B1F]/20 active:bg-[#F7F4F0] transition-colors"
                            >
                                <span className="text-xl mr-3">{fav.icon}</span>
                                <div className="text-left">
                                    <p className="text-xs font-black">{fav.label}</p>
                                    <p className="text-[9px] font-bold opacity-30 tracking-tight">{fav.store}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* AMOUNT */}
                    <div className="bg-[#F7F4F0] rounded-[32px] p-6 pt-8 flex flex-col items-center justify-center">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">
                            {type === '支出' ? '支払金額' : '入金金額'}
                        </label>
                        <div className="relative flex items-center">
                            <span className="text-2xl font-black mb-1 mr-2 opacity-50">¥</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-5xl font-black text-[#3D2B1F] w-48 text-center outline-none placeholder:text-[#3D2B1F]/20"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* BASIC INFO */}
                    <div className="bg-white border-2 border-[#F7F4F0] rounded-[32px] p-2 space-y-1">

                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                            {/* STORE/CLIENT */}
                            <input
                                type="text"
                                value={clientStore}
                                onChange={(e) => setClientStore(e.target.value)}
                                placeholder={type === '支出' ? '支払先' : '請求先'}
                                className="bg-[#F7F4F0]/50 px-6 py-4 xl:py-5 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30"
                            />

                            {/* CATEGORY */}
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-[#F7F4F0]/50 px-6 py-4 xl:py-5 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] appearance-none"
                            >
                                <option value="">カテゴリ</option>
                                {type === '支出' ? (
                                    categories.filter(c => c.id !== 'all').map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))
                                ) : (
                                    <option value="sales">売上</option>
                                )}
                            </select>
                        </div>

                        {/* MEMO */}
                        <div className="relative">
                            <input
                                type="text"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="メモ (例：A社打ち合わせ)"
                                className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30"
                            />
                        </div>
                    </div>

                </form>
            </div>

            {/* Bottom Sticky Action Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#F7F4F0] p-6 pb-8 flex items-center justify-between z-10 shrink-0">

                {/* AI / Camera Button */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => !isScanning && fileInputRef.current?.click()}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScanning ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7F4F0] text-[#3D2B1F] hover:bg-[#3D2B1F]/10'}`}
                    >
                        {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon size={22} />}
                    </button>
                    {!isScanning && apiKey && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Sparkles size={10} className="text-white" />
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                    />
                </div>

                <button
                    form="tx-form"
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none sm:w-64 ml-4 h-14 rounded-full font-black text-sm flex items-center justify-center shadow-2xl transition-all ${isSubmitting ? 'bg-[#3D2B1F]/50 text-white cursor-not-allowed' : 'bg-[#3D2B1F] text-white hover:bg-black hover:scale-[1.02] hover:-translate-y-1'}`}
                >
                    {isSubmitting ? '保存中...' : (
                        <>
                            <span>保存する</span>
                            <ArrowRight size={16} className="ml-2 py-0.5 opacity-50" />
                        </>
                    )}
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default TransactionForm;
