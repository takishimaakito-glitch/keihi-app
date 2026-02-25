import { useState } from 'react';
import { Plus, Trash2, Download, Printer } from 'lucide-react';

interface InvoiceItem {
    id: string;
    name: string;
    qty: number;
    price: number;
}

const InvoiceBuilder = () => {
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', name: 'Webサイトデザイン設計', qty: 1, price: 150000 },
        { id: '2', name: 'コーディング（フロントエンド）', qty: 1, price: 200000 },
    ]);
    const [client, setClient] = useState('株式会社サンプル 様');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNo, setInvoiceNo] = useState('INV-202310-001');
    const [taxRate] = useState(0.1);

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

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = Math.floor(subtotal * taxRate);
    const total = subtotal + tax;

    return (
        <div className="space-y-6 pb-24 text-[#3D2B1F]">
            {/* Header Actions */}
            <header className="flex justify-between items-end flex-wrap gap-4 px-2">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">請求書作成</h2>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Invoice Builder</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <button className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-6 py-3 bg-white text-[#3D2B1F] rounded-full font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-sm border border-[#3D2B1F]/5">
                        <Printer size={16} className="mr-2 opacity-50" /> 印刷
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-6 py-3 bg-[#3D2B1F] text-white rounded-full font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-xl">
                        <Download size={16} className="mr-2" /> ＰＤＦ
                    </button>
                </div>
            </header>

            {/* Main Form Area */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 p-6 sm:p-10">

                <h1 className="text-4xl sm:text-5xl font-black text-[#3D2B1F] tracking-tighter mb-8 italic">INVOICE</h1>

                {/* 基本情報入力 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-2">請求先</label>
                        <input
                            type="text"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            className="w-full bg-[#F7F4F0]/50 p-4 rounded-2xl font-bold border border-transparent hover:border-[#3D2B1F]/10 focus:bg-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition"
                            placeholder="会社名・氏名"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-2">請求日</label>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                className="w-full bg-[#F7F4F0]/50 p-4 rounded-2xl font-bold border border-transparent hover:border-[#3D2B1F]/10 focus:bg-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-2">請求番号</label>
                            <input
                                type="text"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                className="w-full bg-[#F7F4F0]/50 p-4 rounded-2xl font-bold border border-transparent hover:border-[#3D2B1F]/10 focus:bg-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Sender & Summary */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-8 border-b-2 border-[#F7F4F0]">
                    <div className="text-sm order-2 md:order-1 bg-[#F7F4F0]/30 p-5 rounded-3xl w-full md:w-auto">
                        <p className="font-black mb-1">山田 太郎 (FreelanceTax)</p>
                        <div className="text-[11px] font-bold leading-relaxed opacity-60">
                            <p>〒100-0000</p>
                            <p>東京都千代田区丸の内1-1-1</p>
                            <p>taro.yamada@example.com</p>
                            <p>T1234567890123 (適格事業者)</p>
                        </div>
                    </div>
                    <div className="bg-[#3D2B1F] text-white p-6 rounded-[24px] w-full md:w-1/3 text-center shadow-lg order-1 md:order-2">
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">ご請求金額</p>
                        <p className="text-3xl font-black tracking-tighter">¥{total.toLocaleString()}</p>
                    </div>
                </div>

                {/* Items (Mobile-first List Layout) */}
                <div className="mb-10">
                    <h3 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4 pl-2">請求明細</h3>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-[#F7F4F0]/40 p-5 rounded-3xl border border-[#F7F4F0] relative group">
                                <div className="absolute -top-3 -right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="bg-white text-rose-500 hover:bg-rose-50 p-2 rounded-full shadow-md active:scale-95"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="text-[10px] font-black opacity-20 w-6">{index + 1}.</span>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                            className="w-full bg-white p-3 rounded-xl font-bold text-sm border border-transparent focus:border-[#3D2B1F]/10 outline-none"
                                            placeholder="品目名を入力"
                                        />
                                    </div>
                                    <div className="flex gap-3 pl-6">
                                        <div className="w-1/3 max-w-[100px] relative">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white p-3 pr-8 rounded-xl font-bold text-sm text-center border border-transparent focus:border-[#3D2B1F]/10 outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">個</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">@¥</span>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white p-3 pl-8 rounded-xl font-bold text-sm text-right border border-transparent focus:border-[#3D2B1F]/10 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="mt-4 flex items-center justify-center w-full py-4 text-[11px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border-2 border-dashed border-[#3D2B1F]/10 rounded-3xl hover:bg-[#F7F4F0]"
                    >
                        <Plus size={14} className="mr-2" /> 明細を追加する
                    </button>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-10">
                    <div className="w-full md:w-1/2 bg-[#F7F4F0]/60 p-6 rounded-3xl space-y-3">
                        <div className="flex justify-between py-2 border-b border-[#3D2B1F]/5">
                            <span className="text-xs font-bold opacity-50">小計 (税抜)</span>
                            <span className="text-sm font-black tracking-tighter">¥{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#3D2B1F]/5">
                            <span className="text-xs font-bold opacity-50">消費税 (10%)</span>
                            <span className="text-sm font-black tracking-tighter">¥{tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-4 pb-2">
                            <span className="text-base font-black">合計</span>
                            <span className="text-xl font-black tracking-tighter">¥{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-2">振込先</label>
                        <div className="bg-[#F7F4F0]/50 p-5 rounded-3xl font-bold border border-transparent">
                            <p className="mb-1">○○銀行 △△支店</p>
                            <p className="mb-1">普通口座 1234567</p>
                            <p className="opacity-60 text-xs mt-2">ヤマダ タロウ</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-2">備考</label>
                        <textarea
                            className="w-full text-xs sm:text-sm bg-[#F7F4F0]/50 p-5 rounded-3xl font-bold border border-transparent outline-none transition resize-none hover:bg-[#F7F4F0] focus:ring-2 focus:ring-[#3D2B1F]/5"
                            rows={4}
                            placeholder="お支払期限や注意事項など"
                            defaultValue="お支払期限：末日締め翌月末払い&#13;&#10;振込手数料は貴社にてご負担をお願いいたします。"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoiceBuilder;
