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
        <div className="space-y-6 pb-8 text-[#3D2B1F] max-w-5xl mx-auto">
            <header className="px-2 flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">請求書作成</h2>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Invoice Builder</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-6 py-3 bg-white text-[#3D2B1F] rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-sm">
                        <Printer size={16} className="mr-2 opacity-50" /> 印刷
                    </button>
                    <button className="flex items-center px-6 py-3 bg-[#3D2B1F] text-white rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl">
                        <Download size={16} className="mr-2" /> 保存
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[40px] shadow-sm border border-[#3D2B1F]/5 p-6 sm:p-12 overflow-x-auto">
                <div className="min-w-[600px]">
                    <div className="flex justify-between items-start mb-12">
                        <div className="w-1/2">
                            <h1 className="text-5xl font-black text-[#3D2B1F] tracking-tighter mb-6">INVOICE</h1>
                            <div className="mb-4">
                                <label className="block text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">請求先</label>
                                <input
                                    type="text"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    className="w-full text-xl font-bold border-b-2 border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition px-0 py-1"
                                    placeholder="会社名・氏名"
                                />
                            </div>
                        </div>
                        <div className="text-right w-1/3 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">請求日</label>
                                <input
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="text-right w-full text-sm font-bold border-b-2 border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition px-0 py-1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">請求書番号</label>
                                <input
                                    type="text"
                                    defaultValue="INV-202310-001"
                                    className="text-right w-full text-sm font-bold border-b-2 border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none transition px-0 py-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 請求元情報とサマリー */}
                    <div className="flex justify-between items-end mb-12 pb-8 border-b-2 border-[#F7F4F0]">
                        <div className="text-sm">
                            <p className="font-black mb-1">山田 太郎 (FreelanceTax)</p>
                            <div className="text-xs font-bold leading-relaxed opacity-60">
                                <p>〒100-0000</p>
                                <p>東京都千代田区丸の内1-1-1</p>
                                <p>taro.yamada@example.com</p>
                                <p>T1234567890123 (適格請求書発行事業者)</p>
                            </div>
                        </div>
                        <div className="bg-[#F7F4F0]/50 p-6 rounded-[24px] w-1/3 border border-[#3D2B1F]/5 text-center">
                            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">ご請求金額</p>
                            <p className="text-3xl font-black tracking-tighter">¥{total.toLocaleString()}<span className="text-sm ml-1 opacity-50">-</span></p>
                        </div>
                    </div>

                    {/* 明細テーブル */}
                    <div className="mb-12">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-[#3D2B1F]/10">
                                    <th className="py-3 text-[10px] font-black opacity-30 uppercase tracking-widest w-1/2">内容</th>
                                    <th className="py-3 text-[10px] font-black opacity-30 uppercase tracking-widest w-24 text-center">数量</th>
                                    <th className="py-3 text-[10px] font-black opacity-30 uppercase tracking-widest w-32 text-right">単価</th>
                                    <th className="py-3 text-[10px] font-black opacity-30 uppercase tracking-widest w-32 text-right">金額</th>
                                    <th className="py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F7F4F0]">
                                {items.map((item) => (
                                    <tr key={item.id} className="group">
                                        <td className="py-4">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                className="w-full text-sm font-bold bg-transparent border-b border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none px-1 py-1"
                                                placeholder="品目名"
                                            />
                                        </td>
                                        <td className="py-4">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full text-sm font-bold text-center bg-transparent border-b border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none px-1 py-1"
                                            />
                                        </td>
                                        <td className="py-4">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">¥</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                                                    className="w-full text-sm font-bold text-right bg-transparent border-b border-transparent hover:border-[#F7F4F0] focus:border-[#3D2B1F]/20 outline-none pl-6 pr-1 py-1"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 text-right text-sm font-black pr-1 tracking-tighter">
                                            ¥{(item.qty * item.price).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <button
                            onClick={addItem}
                            className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                        >
                            <Plus size={14} className="mr-1" /> Add Row
                        </button>
                    </div>

                    {/* 合計計算 */}
                    <div className="flex justify-end mb-12">
                        <div className="w-1/3">
                            <div className="flex justify-between py-3 border-b border-[#F7F4F0]">
                                <span className="text-xs font-bold opacity-50">小計</span>
                                <span className="text-sm font-black tracking-tighter">¥{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-[#F7F4F0]">
                                <span className="text-xs font-bold opacity-50">消費税 (10%)</span>
                                <span className="text-sm font-black tracking-tighter">¥{tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-5 border-b-2 border-[#3D2B1F]">
                                <span className="text-base font-black">合計</span>
                                <span className="text-lg font-black tracking-tighter">¥{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* 備考・振込先情報 */}
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">振込先</label>
                            <div className="bg-[#F7F4F0]/50 p-6 rounded-[24px] font-bold border border-[#F7F4F0]">
                                <p className="mb-1">○○銀行 △△支店 (普) 1234567</p>
                                <p className="opacity-60 text-xs">ヤマダ タロウ</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">備考</label>
                            <textarea
                                className="w-full text-sm bg-[#F7F4F0]/50 p-6 rounded-[24px] font-bold border border-[#F7F4F0] outline-none transition resize-none hover:bg-[#F7F4F0] focus:ring-2 focus:ring-[#3D2B1F]/5"
                                rows={3}
                                placeholder="お支払期限：2023年11月末日"
                                defaultValue="お支払期限：2023年11月末日&#13;&#10;振込手数料は貴社にてご負担をお願いいたします。"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceBuilder;
