import React, { useState, useEffect, useRef } from 'react';
import { User, FileText, Calendar, Plus, Download, Printer, Banknote, Trash2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InvoiceItem {
    id: string;
    name: string;
    qty: number;
    price: number;
}

const InvoiceBuilder = () => {
    // ---- Auto-Save State Loaders ----
    const loadDraft = () => {
        const saved = localStorage.getItem('keihi-invoice-draft');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return {
            items: [
                { id: '1', name: 'Webサイトデザイン設計', qty: 1, price: 150000 },
                { id: '2', name: 'コーディング', qty: 1, price: 200000 },
            ],
            client: '株式会社サンプル\n御中',
            invoiceDate: new Date().toISOString().split('T')[0],
            invoiceNo: 'INV-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '-01',
            isWithholding: true
        };
    };

    const loadSender = () => {
        const saved = localStorage.getItem('keihi-sender-profile');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return {
            name: '山田 太郎 (たきしま経費管理)',
            zip: '100-0000',
            address: '東京都千代田区丸の内1-1-1',
            email: 'taro.yamada@example.com',
            regNo: 'T1234567890123'
        };
    };

    const loadBankProfile = () => {
        const savedBank = localStorage.getItem('keihi-bank-profile');
        if (savedBank) {
            try { return JSON.parse(savedBank); } catch (e) { }
        }
        // Fallback to legacy format where bank stuff was saved in sender profile
        const savedSender = localStorage.getItem('keihi-sender-profile');
        if (savedSender) {
            try {
                const s = JSON.parse(savedSender);
                if (s.bankInfo || s.notes) {
                    return { bankInfo: s.bankInfo || '', notes: s.notes || '' };
                }
            } catch (e) { }
        }
        return {
            bankInfo: '○○銀行 △△支店\n普通口座 1234567\nヤマダ タロウ',
            notes: 'お支払期限：末日締め翌月末払い\n振込手数料は貴社にてご負担をお願いいたします。'
        };
    };

    // Preset Lists
    const loadSavedClients = () => {
        const saved = localStorage.getItem('keihi-saved-clients');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return [];
    };

    // ---- State ----
    const draft = loadDraft();
    const [items, setItems] = useState<InvoiceItem[]>(draft.items);
    const [client, setClient] = useState(draft.client);
    const [invoiceDate, setInvoiceDate] = useState(draft.invoiceDate);
    const [invoiceNo, setInvoiceNo] = useState(draft.invoiceNo);
    const [isWithholding, setIsWithholding] = useState(draft.isWithholding);
    const [taxRate] = useState(0.1);

    const [senderProfile, setSenderProfile] = useState(loadSender());
    const [bankProfile, setBankProfile] = useState(loadBankProfile());
    const [savedClients, setSavedClients] = useState<string[]>(loadSavedClients());
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    // UI State
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // ---- Auto-Save Effects ----
    useEffect(() => {
        const currentDraft = { items, client, invoiceDate, invoiceNo, isWithholding };
        localStorage.setItem('keihi-invoice-draft', JSON.stringify(currentDraft));
    }, [items, client, invoiceDate, invoiceNo, isWithholding]);

    useEffect(() => {
        if (savedClients.length > 0) {
            localStorage.setItem('keihi-saved-clients', JSON.stringify(savedClients));
            const saveRemote = async () => {
                await supabase.from('app_meta').upsert({ key: 'keihi-saved-clients', value: JSON.stringify(savedClients) });
            };
            saveRemote();
        }
    }, [savedClients]);

    // Load Supabase Settings on mount
    useEffect(() => {
        const loadRemoteSettings = async () => {
            const { data, error } = await supabase.from('app_meta').select('*').in('key', ['keihi-sender-profile', 'keihi-bank-profile', 'keihi-saved-clients']);
            if (!error && data) {
                let sProfile = null;
                let bProfile = null;
                let sClients = null;
                data.forEach(item => {
                    try {
                        const parsed = JSON.parse(item.value);
                        if (item.key === 'keihi-sender-profile') sProfile = parsed;
                        if (item.key === 'keihi-bank-profile') bProfile = parsed;
                        if (item.key === 'keihi-saved-clients') sClients = parsed;
                    } catch (e) { }
                });
                if (sProfile) setSenderProfile(sProfile);
                if (bProfile) setBankProfile(bProfile);
                if (sClients) setSavedClients(sClients);
            }
        };
        loadRemoteSettings();
    }, []);

    // ---- Handlers ----
    const updateSenderProfile = (field: keyof typeof senderProfile, value: string) => {
        setSenderProfile({ ...senderProfile, [field]: value });
    };

    const handleSaveSenderProfile = async () => {
        localStorage.setItem('keihi-sender-profile', JSON.stringify(senderProfile));
        await supabase.from('app_meta').upsert({ key: 'keihi-sender-profile', value: JSON.stringify(senderProfile) });
        alert('発行元情報を保存しました。次回からこの情報がデフォルトで読み込まれます。');
    };

    const handleLoadSenderProfile = () => {
        setSenderProfile(loadSender());
    };

    const updateBankProfile = (field: keyof typeof bankProfile, value: string) => {
        setBankProfile({ ...bankProfile, [field]: value });
    };

    const handleSaveBankProfile = async () => {
        localStorage.setItem('keihi-bank-profile', JSON.stringify(bankProfile));
        await supabase.from('app_meta').upsert({ key: 'keihi-bank-profile', value: JSON.stringify(bankProfile) });
        alert('振込先・備考を保存しました。次回からこの情報がデフォルトで読み込まれます。');
    };

    const handleLoadBankProfile = () => {
        setBankProfile(loadBankProfile());
    };

    const handleSaveClient = () => {
        if (!client.trim()) return;
        if (!savedClients.includes(client)) {
            setSavedClients([...savedClients, client]);
            alert('取引先を保存しました。');
        } else {
            alert('この取引先はすでに保存されています。');
        }
    };

    const handleSelectClient = (c: string) => {
        setClient(c);
        setShowClientDropdown(false);
    };

    const handleRemoveClient = (c: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedClients(savedClients.filter(sc => sc !== c));
    };

    const addItem = () => {
        const newItem = { id: Date.now().toString(), name: '', qty: 1, price: 0 };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handlePrint = () => {
        window.print();
    };

    // ---- Calculations ----
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = Math.floor(subtotal * taxRate);
    const withholdingTax = isWithholding ? Math.floor(subtotal * 0.1021) : 0;
    const total = subtotal + tax - withholdingTax;

    // ---- Dynamic Client Text Size Calculation ----
    // If client string is long or has many lines, make it smaller so it doesn't break the layout
    const clientLines = client.split('\n').length;
    const clientLength = client.length;
    let clientFontSizeTitle = "text-xl lg:text-2xl"; // default
    if (clientLines > 2 || clientLength > 25) {
        clientFontSizeTitle = "text-md lg:text-lg"; // smaller
    } else if (clientLines > 3 || clientLength > 40) {
        clientFontSizeTitle = "text-sm lg:text-base"; // much smaller
    }

    return (
        <div className="min-h-screen bg-[#F7F4F0] font-sans text-[#3D2B1F] pb-24 lg:pb-12 print:bg-white relative">

            {/* ----------------- EDITOR VIEW ----------------- */}
            <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 ${showPreview ? 'hidden print:block' : 'block'}`}>

                {/* Header Actions */}
                <header className="flex justify-between items-center px-2 print:hidden sticky top-0 py-4 z-10 bg-[#F7F4F0]/90 backdrop-blur border-b border-[#3D2B1F]/5 -mt-4 mb-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight text-[#3D2B1F]">請求書の作成</h1>
                        <p className="text-[10px] font-bold text-[#3D2B1F]/30 uppercase tracking-[0.2em]">Invoice Builder</p>
                    </div>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="bg-[#3D2B1F] text-white px-5 sm:px-8 py-3 rounded-full font-black text-xs sm:text-sm flex items-center shadow-xl shadow-[#3D2B1F]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Eye size={18} className="mr-2" /> サンプル確認
                    </button>
                </header>

                <div className="space-y-6 print:hidden">

                    <FormSection
                        title="取引先情報"
                        icon={<User size={18} />}
                        actionButtons={
                            <div className="flex gap-2 relative">
                                <button
                                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                                    className="text-[10px] font-bold bg-[#3D2B1F]/5 hover:bg-[#3D2B1F]/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    登録から選ぶ
                                </button>
                                {showClientDropdown && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#3D2B1F]/10 shadow-xl rounded-2xl z-20 py-2 max-h-48 overflow-y-auto">
                                        {savedClients.length === 0 ? (
                                            <p className="px-4 py-3 text-xs text-[#3D2B1F]/40 font-bold">保存された取引先はありません</p>
                                        ) : (
                                            savedClients.map((c, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSelectClient(c)}
                                                    className="px-4 py-3 hover:bg-[#F7F4F0] cursor-pointer text-xs font-bold border-b border-[#3D2B1F]/5 last:border-0 flex justify-between items-center group"
                                                >
                                                    <span className="truncate whitespace-pre-wrap">{c.split('\n')[0]}...</span>
                                                    <button
                                                        onClick={(e) => handleRemoveClient(c, e)}
                                                        className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={handleSaveClient}
                                    className="text-[10px] font-bold bg-white border border-[#3D2B1F]/10 hover:bg-[#F7F4F0] px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                                >
                                    現在の取引先を保存
                                </button>
                            </div>
                        }
                    >
                        <textarea
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            placeholder="株式会社サンプル&#10;御中"
                            rows={2}
                            className="w-full bg-transparent outline-none font-bold text-sm placeholder:opacity-40 resize-none"
                        />
                    </FormSection>

                    <FormSection title="請求項目" icon={<FileText size={18} />}>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-[#3D2B1F]/5 group">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                        placeholder="項目名"
                                        className="flex-[2] bg-transparent outline-none text-sm font-bold min-w-0"
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="flex bg-white rounded-xl border border-[#3D2B1F]/10 overflow-hidden flex-1 shadow-sm">
                                            <input
                                                type="number"
                                                value={item.qty === 0 ? '' : item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full text-center bg-transparent outline-none text-xs font-bold py-3"
                                                placeholder="数量"
                                            />
                                            <span className="w-px bg-[#3D2B1F]/10"></span>
                                            <input
                                                type="number"
                                                value={item.price === 0 ? '' : item.price}
                                                onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent outline-none text-xs font-bold py-3 pr-3"
                                                placeholder="単価"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-rose-400 hover:text-rose-600 bg-white p-3 rounded-xl border border-[#3D2B1F]/10 shadow-sm transition-colors shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addItem}
                                className="flex items-center justify-center w-full py-3 text-xs font-black text-[#3D2B1F]/40 hover:text-[#3D2B1F] bg-[#3D2B1F]/5 hover:bg-[#3D2B1F]/10 rounded-xl transition-colors mt-2"
                            >
                                <Plus size={16} className="mr-1" /> 項目を追加する
                            </button>

                            <div className="pt-4 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold opacity-80 bg-white border border-[#3D2B1F]/10 px-4 py-3 rounded-xl shadow-sm w-full">
                                    <input
                                        type="checkbox"
                                        checked={isWithholding}
                                        onChange={(e) => setIsWithholding(e.target.checked)}
                                        className="w-4 h-4 rounded border-[#3D2B1F]/20 text-[#3D2B1F] focus:ring-[#3D2B1F]"
                                    />
                                    <span>源泉徴収税 (10.21%) を差し引く</span>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="発行日・請求番号" icon={<Calendar size={18} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 overflow-hidden">
                                <p className="text-[10px] font-bold opacity-40">請求日</p>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full bg-white px-3 sm:px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm focus:ring-2 focus:ring-[#3D2B1F]/20 transition-all min-w-0"
                                />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold opacity-40">請求番号</p>
                                <input
                                    type="text"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm uppercase shadow-sm focus:ring-2 focus:ring-[#3D2B1F]/20 transition-all"
                                />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title="発行元情報"
                        icon={<User size={18} />}
                        actionButtons={
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLoadSenderProfile}
                                    className="text-[10px] font-bold bg-[#3D2B1F]/5 hover:bg-[#3D2B1F]/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    保存情報を読み込む
                                </button>
                                <button
                                    onClick={handleSaveSenderProfile}
                                    className="text-[10px] font-bold bg-[#3D2B1F] text-white px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform"
                                >
                                    現在の内容を保存
                                </button>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" value={senderProfile.name} onChange={(e) => updateSenderProfile('name', e.target.value)} placeholder="氏名・屋号" className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm col-span-1 sm:col-span-2" />
                            <div className="flex gap-2 items-center bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 shadow-sm focus-within:ring-2 focus-within:ring-[#3D2B1F]/20">
                                <span className="opacity-40 font-bold text-sm">〒</span>
                                <input type="text" value={senderProfile.zip} onChange={(e) => updateSenderProfile('zip', e.target.value)} placeholder="000-0000" className="w-full bg-transparent outline-none font-bold text-sm" />
                            </div>
                            <input type="text" value={senderProfile.regNo} onChange={(e) => updateSenderProfile('regNo', e.target.value)} placeholder="インボイス番号 (T...)" className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm" />
                            <input type="text" value={senderProfile.address} onChange={(e) => updateSenderProfile('address', e.target.value)} placeholder="住所" className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm col-span-1 sm:col-span-2" />
                            <input type="text" value={senderProfile.email} onChange={(e) => updateSenderProfile('email', e.target.value)} placeholder="Email / 電話番号" className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm col-span-1 sm:col-span-2" />
                        </div>
                    </FormSection>

                    <FormSection
                        title="振込先・備考"
                        icon={<Banknote size={18} />}
                        actionButtons={
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLoadBankProfile}
                                    className="text-[10px] font-bold bg-[#3D2B1F]/5 hover:bg-[#3D2B1F]/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    保存情報を読み込む
                                </button>
                                <button
                                    onClick={handleSaveBankProfile}
                                    className="text-[10px] font-bold bg-[#3D2B1F] text-white px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform"
                                >
                                    現在の内容を保存
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <textarea
                                value={bankProfile.bankInfo}
                                onChange={(e) => updateBankProfile('bankInfo', e.target.value)}
                                rows={3}
                                className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm resize-none"
                                placeholder="銀行名、支店名、口座種別、口座番号、名義など"
                            ></textarea>
                            <textarea
                                value={bankProfile.notes}
                                onChange={(e) => updateBankProfile('notes', e.target.value)}
                                rows={2}
                                className="w-full bg-white px-4 py-3 rounded-xl border border-[#3D2B1F]/10 outline-none font-bold text-sm shadow-sm resize-none"
                                placeholder="お支払期限や注意事項など"
                            ></textarea>
                        </div>
                    </FormSection>
                </div>
            </div>

            {/* ----------------- PREVIEW MODAL / PRINT VIEW ----------------- */}
            {(showPreview) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center print:static print:flex print:bg-white print:z-auto print:p-0">

                    {/* Dark Overlay (hidden in print) */}
                    <div className="absolute inset-0 bg-[#3D2B1F]/80 backdrop-blur-sm print:hidden" onClick={() => setShowPreview(false)}></div>

                    {/* Modal Content */}
                    <div className="relative z-10 w-full h-full sm:w-auto sm:h-auto sm:max-h-[95vh] flex flex-col items-center print:w-full print:h-auto print:max-h-none print:max-w-none print:p-0 print:m-0">

                        {/* Modal Header Actions (hidden in print) */}
                        <div className="w-full max-w-[210mm] flex justify-between items-center p-4 print:hidden shrink-0">
                            <button onClick={() => setShowPreview(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                            <div className="flex gap-2 sm:gap-3 shrink-0">
                                <button onClick={() => alert('ブラウザの印刷設定から「PDFとして保存」を選択し、「背景のグラフィック」をオンにして保存してください。')} className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs flex items-center transition-colors">
                                    <Download size={14} className="mr-1 sm:mr-2" /> 保存 (PDF)
                                </button>
                                <button onClick={handlePrint} className="bg-white text-[#3D2B1F] px-3 sm:px-4 py-2 rounded-full font-black text-[10px] sm:text-xs flex items-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                                    <Printer size={14} className="mr-1 sm:mr-2 opacity-50" /> 印刷する
                                </button>
                            </div>
                        </div>

                        {/* Paper Output Container */}
                        <div className="flex-1 overflow-y-auto sm:rounded-[32px] w-full flex justify-center custom-scrollbar print:overflow-visible print:rounded-none print:block print:p-0">
                            <div className="relative transform origin-top w-[210mm] scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 print:transform-none print:w-full print:max-w-none print:scale-100 print:static print:m-0" ref={printRef}>
                                <div className="w-[210mm] min-h-[297mm] bg-[#fdfdfc] shadow-[0_30px_60px_rgba(0,0,0,0.15),_0_0_0_1px_rgba(0,0,0,0.05)] print:w-full print:h-[296mm] print:min-h-0 print:overflow-hidden print:shadow-none print:border-none print:bg-white box-border"
                                    style={{
                                        fontFamily: '"Yu Mincho", "MS PMincho", "Hiragino Mincho ProN", serif',
                                        backgroundImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 100%)',
                                        color: '#2b2927'
                                    }}>

                                    {/* Inner Paper Padding */}
                                    <div className="p-16 lg:p-24 relative z-10 flex flex-col min-h-[297mm] print:min-h-0 print:h-full box-border">

                                        {/* Title & Metadata Header */}
                                        <div className="flex justify-between items-start mb-16 relative">
                                            <h1 className="text-4xl tracking-[0.3em] font-normal border-b-2 border-[#2b2927] pb-4 pr-4 pl-1">請求書</h1>

                                            <div className="text-right text-xs tracking-wider space-y-1.5 opacity-90 leading-relaxed font-sans mt-2">
                                                <div className="flex justify-end gap-2">
                                                    <span className="opacity-60 font-serif">請求日:</span>
                                                    <span className="font-sans min-w-[120px] text-right">{invoiceDate.replace(/-/g, '/')}</span>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <span className="opacity-60 font-serif">請求番号:</span>
                                                    <span className="font-sans min-w-[120px] text-right uppercase">{invoiceNo || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client & Sender Section */}
                                        <div className="flex justify-between items-start gap-12 mb-16 relative">

                                            {/* Client (Left) */}
                                            <div className="w-[55%]">
                                                <div className="border-b-2 border-[#2b2927] pb-2 mb-4">
                                                    <div className={`w-full bg-transparent tracking-widest outline-none min-h-[40px] whitespace-pre-wrap leading-relaxed ${clientFontSizeTitle}`}>
                                                        {client}
                                                    </div>
                                                </div>
                                                <p className="text-xs opacity-70 tracking-widest leading-loose font-sans">
                                                    下記の通り、ご請求申し上げます。
                                                </p>

                                                {/* Total Amount Box */}
                                                <div className="mt-8 relative inline-block">
                                                    <p className="text-[10px] tracking-widest opacity-60 mb-1 font-sans">ご請求金額 (税込)</p>
                                                    <div className="flex items-end gap-3 border-b-[3px] border-[#2b2927] pb-2 px-2">
                                                        <span className="text-2xl font-serif">¥</span>
                                                        <span className="text-4xl lg:text-5xl font-sans font-bold tracking-tight">{total.toLocaleString()}</span>
                                                        <span className="text-sm font-sans opacity-70 mb-1">-</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sender (Right) with Stamp Effect */}
                                            <div className="w-[45%] text-xs tracking-wider space-y-1.5 leading-relaxed relative isolate font-sans">

                                                <div className="w-full text-base tracking-widest mb-3 font-serif min-h-[24px]">
                                                    {senderProfile.name}
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="opacity-60 shrink-0 mr-1">〒</span>
                                                    <div className="w-full min-h-[18px]">{senderProfile.zip}</div>
                                                </div>
                                                <div className="w-full min-h-[18px] whitespace-pre-wrap">{senderProfile.address}</div>
                                                <div className="w-full min-h-[18px] whitespace-pre-wrap">{senderProfile.email}</div>
                                                <div className="pt-2">
                                                    <div className="w-full opacity-60 min-h-[18px]">{senderProfile.regNo}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invoice Items Table (Traditional Design) */}
                                        <div className="mb-12 font-sans relative z-20">
                                            <table className="w-full text-xs text-[#2b2927] border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-t-2 border-[#2b2927] bg-[#2b2927]/[0.02]">
                                                        <th className="py-3 text-left font-bold tracking-widest pl-3 w-[50%]">摘要</th>
                                                        <th className="py-3 text-center font-bold tracking-widest w-[15%]">数量</th>
                                                        <th className="py-3 text-right font-bold tracking-widest w-[15%]">単価</th>
                                                        <th className="py-3 text-right font-bold tracking-widest w-[20%] pr-3">金額</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item) => (
                                                        <tr key={item.id} className="border-b border-[rgba(43,41,39,0.1)]">
                                                            <td className="py-3 pl-3 font-serif tracking-wider">{item.name}</td>
                                                            <td className="py-3 text-center font-sans">{item.qty || ''}</td>
                                                            <td className="py-3 text-right font-sans">{item.price ? item.price.toLocaleString() : ''}</td>
                                                            <td className="py-3 text-right pr-3 tracking-wider font-sans">
                                                                {(item.qty * item.price).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {items.length === 0 && (
                                                        <tr className="border-b border-[rgba(43,41,39,0.1)]">
                                                            <td colSpan={4} className="py-6 text-center opacity-30 italic font-serif">項目が入力されていません</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Breakdown Totals (Right Aligned) */}
                                        <div className="flex justify-end mb-16 font-sans relative z-20">
                                            <div className="w-[50%]">
                                                <table className="w-full text-xs border-collapse">
                                                    <tbody>
                                                        <tr className="border-b border-[#2b2927]/10">
                                                            <td className="py-2 text-left opacity-70 tracking-widest pl-2">小計 (税抜)</td>
                                                            <td className="py-2 text-right tracking-wider pr-2">{subtotal.toLocaleString()}</td>
                                                        </tr>
                                                        <tr className="border-b border-[#2b2927]/10">
                                                            <td className="py-2 text-left opacity-70 tracking-widest pl-2">消費税 (10%)</td>
                                                            <td className="py-2 text-right tracking-wider pr-2">{tax.toLocaleString()}</td>
                                                        </tr>
                                                        {isWithholding && (
                                                            <tr className="border-b border-[#2b2927]/10 text-[#2b2927]">
                                                                <td className="py-2 text-left opacity-70 tracking-widest pl-2">源泉徴収税額 (10.21%)</td>
                                                                <td className="py-2 text-right tracking-wider pr-2 text-rose-700/80 print:text-[#2b2927]">- {withholdingTax.toLocaleString()}</td>
                                                            </tr>
                                                        )}
                                                        <tr className="border-t-2 border-b-2 border-[#2b2927] font-bold text-sm bg-[#2b2927]/[0.02]">
                                                            <td className="py-3 text-left tracking-widest pl-2">合計金額</td>
                                                            <td className="py-3 text-right tracking-tight pr-2 text-lg">¥{total.toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Spacer to push footer to bottom */}
                                        <div className="flex-grow"></div>

                                        <div className="grid grid-cols-2 gap-12 font-sans text-[11px] leading-relaxed opacity-80 border-t border-[#2b2927]/20 pt-8 mt-12 relative z-20 print:break-inside-avoid">
                                            <div className="space-y-3">
                                                <h4 className="font-bold tracking-widest border-b border-[#2b2927]/20 pb-2 mb-3 inline-block pr-6">振込先</h4>
                                                <div className="whitespace-pre-wrap">{bankProfile.bankInfo}</div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="font-bold tracking-widest border-b border-[#2b2927]/20 pb-2 mb-3 inline-block pr-6">備考</h4>
                                                <div className="whitespace-pre-wrap">{bankProfile.notes}</div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 0px; }
                
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    html, body, #root { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        padding: 0 !important;
                        margin: 0 !important;
                        height: 296mm !important;
                        max-height: 296mm !important;
                        width: 100% !important;
                        overflow: hidden !important;
                    }
                    /* Ensure only the modal content prints */
                    body > * { display: none !important; }
                    body > #root { display: block !important; }
                    #root > div { background: white !important; }
                    
                    /* Reset app padding */
                    main { overflow: visible !important; padding: 0 !important; }
                    main > div { padding: 0 !important; max-width: none !important; }
                    
                    /* Hide everything except the print active area */
                    .print\\:hidden { display: none !important; }
                    #bottom-nav { display: none !important; }
                    #header { display: none !important; }
                    
                    /* Force hiding of the routing wrapping layer behind the modal */
                    .bg-\\[\\#F7F4F0\\] { background: white !important; min-height: 0 !important; }
                    
                    /* Fix margins */
                    .pb-24 { padding-bottom: 0 !important; }
                }
            `}} />
        </div>
    );
};

// Reusable Form Section Component
function FormSection({ title, icon, actionButtons, children }: { title: string, icon: React.ReactNode, actionButtons?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[32px] p-6 sm:p-8 xl:p-10 shadow-sm border border-[#3D2B1F]/5 space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center space-x-3 text-[#3D2B1F]/30">
                    {icon}
                    <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
                </div>
                {actionButtons && <div>{actionButtons}</div>}
            </div>
            <div className="bg-[#F7F4F0]/30 rounded-[24px] p-4 sm:p-6 transition-all border border-transparent shadow-inner">
                {children}
            </div>
        </div>
    );
}

export default InvoiceBuilder;
