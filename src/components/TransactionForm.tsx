import { useState, useRef, useEffect } from 'react';
import { X, Loader2, Sparkles, ArrowRight, Image as ImageIcon, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    const [error, setError] = useState<{ message: string; details?: string } | null>(null);

    // AI OCR States
    const [isScanning, setIsScanning] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [aiJudgment, setAiJudgment] = useState<{ is_business_expense: boolean; reasoning: string } | null>(null);

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
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setAiJudgment(null);
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

            // Set preview image
            setPreviewImage(`data:${file.type};base64,${base64}`);

            // Determine Media Type
            let mediaType = "image/jpeg";
            if (file.type === "image/png") mediaType = "image/png";
            else if (file.type === "image/webp") mediaType = "image/webp";
            else if (file.type === "application/pdf") mediaType = "application/pdf";

            const isExpense = type === '支出';
            const categoriesPrompt = isExpense
                ? `また、category には以下のいずれかのIDを指定してください。内容から判断できない場合は"other"にしてください。\n${categories.filter(c => c.id !== 'all').map(c => `- ${c.id} (${c.label}) ${c.keywords ? `キーワード: ${c.keywords}` : ''}`).join('\n')}`
                : '';

            const expenseJudgmentPrompt = isExpense
                ? `\nさらに、このレシートの内容が「一般的なフリーランス/個人事業主の事業経費として適切か」を判定してください。
例えば、深夜の居酒屋、明らかな個人的な趣味の品、生活用品などは false を返してください。
追加フィールドとして以下を含めてください:
"is_business_expense": boolean,
"reasoning": "判定の理由（簡潔に）"`
                : '';

            const promptText = isExpense
                ? `この領収書/レシート画像から情報を抽出してJSONのみ返してください（前置き・説明不要）:
{
  "date": "YYYY-MM-DD",
  "store": "購入先・店舗名",
  "amount": 数値（税込合計金額）,
  "category": "指定されたカテゴリID",
  "memo": "購入内容の簡潔な説明（品目など）",
  "is_business_expense": boolean,
  "reasoning": "経費として適切かどうかの理由"
}
${categoriesPrompt}
${expenseJudgmentPrompt}`
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
                console.error("API Error Response Data:", errData);

                // Construct detailed error message
                let errorDetails = `Status: ${resp.status} ${resp.statusText}`;
                if (errData?.error?.message) {
                    errorDetails += `\n${errData.error.message}`;
                } else if (errData?.error?.type) {
                    errorDetails += `\nType: ${errData.error.type}`;
                }

                if (resp.status === 401) {
                    throw new Error('APIキーが無効、または認証エラーです。設定画面のAPIキーを確認してください。|' + errorDetails);
                } else if (resp.status === 429) {
                    throw new Error('APIの利用制限（レートリミット）に達しました。しばらく待ってからお試しください。|' + errorDetails);
                } else if (resp.status === 400) {
                    throw new Error('リクエストが不正です。画像形式がサポートされていないか、ファイルサイズが大きすぎる可能性があります。|' + errorDetails);
                } else {
                    throw new Error(`AI読み取りに失敗しました。|${errorDetails}`);
                }
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
                if (parsed.reasoning) {
                    setAiJudgment({
                        is_business_expense: parsed.is_business_expense === true,
                        reasoning: parsed.reasoning
                    });
                }
            } else {
                if (parsed.client) setClientStore(parsed.client);
            }

        } catch (err: any) {
            console.error("OCR Error Exception:", err);

            // Parse custom error string format "Message|Details"
            const parts = (err.message || "").split('|');
            const mainMessage = parts[0] || "読み取り処理中に予期せぬエラーが発生しました。";
            const details = parts[1] || err.stack || JSON.stringify(err);

            setError({ message: mainMessage, details });
            setPreviewImage(null); // Clear preview on error
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || !category || !clientStore) {
            setError({ message: '金額、取引先、カテゴリは必須です。' });
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
                setPreviewImage(null);
                setAiJudgment(null);
                alert('保存しました');
            }
        } catch (err: any) {
            setError({ message: err.message || '保存に失敗しました。' });
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
            setError({ message: err.message || '削除に失敗しました。' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-[85vh] text-[#3D2B1F]">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shrink-0 border-b border-[#F7F4F0]">
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
            <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100/50">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-rose-700">{error.message}</h4>
                                {error.details && (
                                    <details className="mt-2 text-xs text-rose-600/70 font-mono">
                                        <summary className="cursor-pointer font-bold hover:text-rose-600">詳細を表示（開発者向け）</summary>
                                        <pre className="mt-2 whitespace-pre-wrap p-2 bg-white/50 rounded-md overflow-x-auto">{error.details}</pre>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Expense Judgment Alert */}
                {aiJudgment && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-start ${aiJudgment.is_business_expense ? 'bg-emerald-50 border-emerald-100/50' : 'bg-amber-50 border-amber-200/50'}`}>
                        {aiJudgment.is_business_expense ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <h4 className={`text-sm font-bold ${aiJudgment.is_business_expense ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {aiJudgment.is_business_expense ? '経費判定: 適切' : '経費判定: プライベートな支出の可能性があります'}
                            </h4>
                            <p className={`text-xs mt-1 leading-relaxed ${aiJudgment.is_business_expense ? 'text-emerald-600/80' : 'text-amber-700/80 font-bold'}`}>
                                {aiJudgment.reasoning}
                            </p>
                        </div>
                    </div>
                )}

                {/* Image Preview Area */}
                {previewImage && (
                    <div className="mb-6 rounded-2xl overflow-hidden border-2 border-[#F7F4F0] relative group bg-[#F7F4F0]/30">
                        <div className="h-40 sm:h-48 flex items-center justify-center p-2 relative">
                            {/* Loader Overlay */}
                            {isScanning && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-[#3D2B1F] animate-spin mb-2" />
                                    <p className="text-xs font-bold text-[#3D2B1F]/70">AIが読み取り中...</p>
                                </div>
                            )}
                            <img src={previewImage} alt="Receipt Preview" className={`max-h-full max-w-full object-contain rounded-xl shadow-sm ${isScanning ? 'opacity-50 blur-sm' : ''}`} />
                        </div>
                        <button
                            onClick={() => { setPreviewImage(null); setAiJudgment(null); }}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-[#3D2B1F]/60 hover:text-rose-500 hover:bg-white shadow-sm transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                            disabled={isScanning}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* いつものセット (Favorites) */}
                <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3 px-2">いつものセットから入力</p>
                    <div className="flex space-x-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
                        {FAVORITES.map((fav, i) => (
                            <button
                                key={i}
                                type="button"
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

                {/* Main Form Fields - Simplified Layout */}
                <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">

                    {/* Amount Input */}
                    <div className="bg-[#F7F4F0]/60 rounded-[28px] p-6 flex items-center justify-between border border-[#3D2B1F]/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] transition-colors focus-within:bg-[#F7F4F0]">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 shrink-0 mr-4">
                            {type === '支出' ? '支払金額' : '入金金額'}
                        </span>
                        <div className="relative flex items-center flex-1 justify-end">
                            <span className="text-2xl font-black mr-2 opacity-50">¥</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-4xl font-black text-[#3D2B1F] w-full text-right outline-none placeholder:text-[#3D2B1F]/20"
                                autoFocus={!isScanning && !previewImage && !initialData}
                            />
                        </div>
                    </div>

                    {/* Basic Info Group (Date, Store, Category, Memo) - Static list style */}
                    <div className="bg-white border border-[#3D2B1F]/10 rounded-[28px] overflow-hidden shadow-sm divide-y divide-[#F7F4F0]">

                        {/* Date */}
                        <div className="flex items-center px-5 py-2 transition-colors focus-within:bg-[#F7F4F0]/30 min-h-[60px]">
                            <label className="text-xs font-bold opacity-40 w-16 shrink-0">日付</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-transparent text-sm font-bold outline-none text-right placeholder:text-[#3D2B1F]/30"
                            />
                        </div>

                        {/* Store/Client */}
                        <div className="flex items-center px-5 py-2 transition-colors focus-within:bg-[#F7F4F0]/30 min-h-[60px]">
                            <label className="text-xs font-bold opacity-40 w-16 shrink-0">{type === '支出' ? '支払先' : '請求先'}</label>
                            <input
                                type="text"
                                value={clientStore}
                                onChange={(e) => setClientStore(e.target.value)}
                                placeholder="入力してください"
                                className="w-full bg-transparent text-sm font-bold outline-none text-right placeholder:text-[#3D2B1F]/30"
                            />
                        </div>

                        {/* Category */}
                        <div className="flex items-center px-5 py-2 transition-colors focus-within:bg-[#F7F4F0]/30 min-h-[60px]">
                            <label className="text-xs font-bold opacity-40 w-16 shrink-0">カテゴリ</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-transparent text-sm font-bold outline-none text-right appearance-none flex-1 text-[#3D2B1F]"
                                style={{ direction: 'rtl' }}
                            >
                                <option value="" disabled className="text-left">選択してください</option>
                                {type === '支出' ? (
                                    categories.filter(c => c.id !== 'all').map(c => (
                                        <option key={c.id} value={c.id} className="text-left">{c.label}</option>
                                    ))
                                ) : (
                                    <option value="sales" className="text-left">売上</option>
                                )}
                            </select>
                        </div>

                        {/* Memo */}
                        <div className="flex items-center px-5 py-2 transition-colors focus-within:bg-[#F7F4F0]/30 min-h-[60px]">
                            <label className="text-xs font-bold opacity-40 w-16 shrink-0">メモ</label>
                            <input
                                type="text"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="具体的な内容 (任意)"
                                className="w-full bg-transparent text-sm font-bold outline-none text-right placeholder:text-[#3D2B1F]/30"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Bottom Sticky Action Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#F7F4F0] p-5 sm:p-6 pb-6 sm:pb-8 flex items-center justify-between z-10 shrink-0 shadow-[0_-10px_30px_rgba(61,43,31,0.03)]">

                {/* AI / Camera Button */}
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => !isScanning && fileInputRef.current?.click()}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${isScanning ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7F4F0] text-[#3D2B1F] hover:bg-[#3D2B1F]/10 border border-[#3D2B1F]/5'}`}
                    >
                        {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon size={22} />}
                    </button>
                    {!isScanning && apiKey && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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

                <div className="flex-1 ml-4 sm:ml-6 flex justify-end">
                    <button
                        form="tx-form"
                        type="submit"
                        disabled={isSubmitting || isScanning}
                        className={`w-full sm:w-64 h-14 rounded-full font-black text-sm flex items-center justify-center shadow-xl transition-all ${isSubmitting || isScanning ? 'bg-[#3D2B1F]/50 text-white cursor-not-allowed shadow-none' : 'bg-[#3D2B1F] text-white hover:bg-black hover:scale-[1.02] hover:-translate-y-1'}`}
                    >
                        {isSubmitting ? '保存中...' : (
                            <>
                                <span>保存する</span>
                                <ArrowRight size={16} className="ml-2 py-0.5 opacity-50" />
                            </>
                        )}
                    </button>
                </div>
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
