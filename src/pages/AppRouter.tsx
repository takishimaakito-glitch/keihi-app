import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, List, Tag, Settings, Plus, FileText, Camera, Pen, BarChart3, Star, Receipt } from 'lucide-react';
import DashboardHome from './DashboardHome';
import TransactionEntry from './TransactionEntry';
import CategoryManagement from './CategoryManagement';
import FavoritesManagement from './FavoritesManagement';
import InvoiceBuilder from './InvoiceBuilder';
import SettingsPage from './Settings';
import Analysis from './Analysis';
import { useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import type { EditTransactionData } from '../components/TransactionForm';

const AppRouter = () => {
    const [showEntry, setShowEntry] = useState(false);
    const [entryMode, setEntryMode] = useState<"default" | "camera">("default");
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [editData, setEditData] = useState<EditTransactionData | null>(null);

    const handleOpenEntry = (mode: "default" | "camera" = "default", initialData: EditTransactionData | null = null) => {
        setIsFabMenuOpen(false);
        setEntryMode(mode);
        setEditData(initialData);
        setShowEntry(true);
    };

    return (
        <Router>
            <div className="min-h-screen bg-[#F7F4F0] font-sans text-[#3D2B1F] flex flex-col pb-24 relative overflow-x-hidden">

                {/* --- 1. モバイルヘッダー --- */}
                <header className="print:hidden p-6 flex justify-between items-center transition-all duration-500 max-w-3xl mx-auto w-full px-6 lg:px-12">
                    <Link to="/" className="flex-1 flex items-center gap-2.5 sm:gap-3 hover:opacity-70 transition-opacity cursor-pointer">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3D2B1F] flex items-center justify-center shrink-0">
                            <Receipt className="text-white w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-lg sm:text-[22px] tracking-tight text-[#3D2B1F] flex items-baseline gap-1.5" style={{ fontFamily: '"Outfit", sans-serif' }}>
                            <span className="font-bold">たきしま</span>
                            <span className="font-medium">expense</span>
                        </h1>
                    </Link>
                    <div className="flex space-x-3 items-center z-30 relative ml-4">
                        <Link to="/favorites" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#3D2B1F] hover:scale-105 hover:bg-[#F7F4F0] transition-all">
                            <Star size={16} />
                        </Link>
                        <Link to="/categories" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#3D2B1F] hover:scale-105 hover:bg-[#F7F4F0] transition-all">
                            <Tag size={16} />
                        </Link>
                        <Link to="/settings" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#3D2B1F] hover:scale-105 hover:bg-[#F7F4F0] transition-all">
                            <Settings size={18} />
                        </Link>
                    </div>
                </header>

                {/* --- 2. メインコンテンツ（スクロールエリア） --- */}
                <main className={`flex-1 overflow-y-auto transition-all duration-500 ${showEntry || isFabMenuOpen ? 'blur-[2px] scale-[0.98] opacity-50' : 'opacity-100'} relative z-10`}>
                    <div className="max-w-3xl mx-auto px-6 lg:px-12 w-full">
                        <Routes>
                            <Route path="/" element={<DashboardHome onOpenEntry={handleOpenEntry} />} />
                            <Route path="/analysis" element={<Analysis onOpenEntry={handleOpenEntry} />} />
                            <Route path="/transactions" element={<TransactionEntry onOpenEntry={handleOpenEntry} />} />
                            <Route path="/categories" element={<CategoryManagement />} />
                            <Route path="/favorites" element={<FavoritesManagement />} />
                            <Route path="/invoices" element={<InvoiceBuilder />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </div>
                </main>

                {/* FAB Menu Backdrop */}
                {isFabMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-white/40 backdrop-blur-sm"
                        onClick={() => setIsFabMenuOpen(false)}
                    />
                )}

                {/* --- 3. ボトムナビゲーション（固定） --- */}
                <nav className="print:hidden fixed bottom-0 inset-x-0 h-24 bg-white/90 backdrop-blur-md border-t border-[#3D2B1F]/5 px-2 flex justify-center gap-3 sm:gap-8 md:gap-12 items-center z-50 shadow-[0_-10px_40px_rgba(61,43,31,0.05)] pb-2 w-full">
                    <NavItem to="/" icon={<Home size={28} />} label="ホーム" onClick={() => setIsFabMenuOpen(false)} />
                    <NavItem to="/analysis" icon={<BarChart3 size={28} />} label="分析" onClick={() => setIsFabMenuOpen(false)} />

                    {/* フローティングアクションボタン (FAB) & メニュー */}
                    <div className="relative -top-8 flex flex-col items-center">

                        {/* FAB Popover Menu */}
                        {isFabMenuOpen && (
                            <div className="absolute bottom-20 flex flex-col items-end space-y-3 animate-in slide-in-from-bottom-5 fade-in duration-200 min-w-max pb-2">
                                <button onClick={() => handleOpenEntry('camera')} className="flex items-center bg-white shadow-xl rounded-full pl-5 pr-2 py-2 gap-4 group border border-[#F7F4F0] hover:border-[#3D2B1F]/20 transition-all hover:scale-105">
                                    <span className="text-xs font-black tracking-widest text-[#3D2B1F]">画像読込</span>
                                    <div className="w-10 h-10 bg-[#3D2B1F] text-white rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                                        <Camera size={18} />
                                    </div>
                                </button>
                                <button onClick={() => handleOpenEntry('camera')} className="flex items-center bg-white shadow-xl rounded-full pl-5 pr-2 py-2 gap-4 group border border-[#F7F4F0] hover:border-[#3D2B1F]/20 transition-all hover:scale-105">
                                    <span className="text-xs font-black tracking-widest text-[#3D2B1F]">PDF読込</span>
                                    <div className="w-10 h-10 bg-[#3D2B1F] text-white rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                                        <FileText size={18} />
                                    </div>
                                </button>
                                <button onClick={() => handleOpenEntry('default')} className="flex items-center bg-white shadow-xl rounded-full pl-5 pr-2 py-2 gap-4 group border border-[#F7F4F0] hover:border-[#3D2B1F]/20 transition-all hover:scale-105">
                                    <span className="text-xs font-black tracking-widest text-[#3D2B1F]">手入力</span>
                                    <div className="w-10 h-10 bg-[#3D2B1F] text-white rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                                        <Pen size={18} />
                                    </div>
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                            className={`w-16 h-16 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#F7F4F0] transition-all duration-300 z-10 ${isFabMenuOpen ? 'bg-black rotate-45 scale-110' : 'bg-[#3D2B1F] hover:scale-110 active:scale-95'}`}
                        >
                            <Plus size={32} />
                        </button>
                    </div>

                    <NavItem to="/transactions" icon={<List size={28} />} label="履歴" onClick={() => setIsFabMenuOpen(false)} />
                    <NavItem to="/invoices" icon={<FileText size={28} />} label="請求書" onClick={() => setIsFabMenuOpen(false)} />
                </nav>

                {/* --- 4. 入力画面（モーダル） --- */}
                {showEntry && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#3D2B1F]/20 backdrop-blur-sm">
                        <div className="w-full max-w-xl bg-white rounded-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                            <TransactionForm onClose={() => setShowEntry(false)} initialMode={entryMode} initialData={editData} />
                        </div>
                    </div>
                )}

            </div>
        </Router>
    );
};

const NavItem = ({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-16 space-y-1.5 transition-colors ${isActive ? 'text-[#3D2B1F] opacity-100' : 'text-[#3D2B1F] opacity-40 hover:opacity-70'}`}
        >
            {icon}
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-tighter">{label}</span>
        </Link>
    );
};

export default AppRouter;
