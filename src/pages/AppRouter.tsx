import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Settings, Plus, FileText } from 'lucide-react';
import DashboardHome from './DashboardHome';
import TransactionEntry from './TransactionEntry';
import CategoryManagement from './CategoryManagement';
import InvoiceBuilder from './InvoiceBuilder';
import SettingsPage from './Settings';
import { useState } from 'react';
import TransactionForm from '../components/TransactionForm';

const AppRouter = () => {
    const [showEntry, setShowEntry] = useState(false);

    return (
        <Router>
            <div className="min-h-screen bg-[#F7F4F0] font-sans text-[#3D2B1F] flex flex-col pb-24 relative">

                {/* --- 1. モバイルヘッダー --- */}
                <header className="p-6 flex justify-between items-center transition-all duration-500 max-w-3xl mx-auto w-full px-6 lg:px-12">
                    <h1 className="text-xl font-black tracking-tight">
                        たきしま <span className="opacity-40 italic font-light">expense</span>
                    </h1>
                    <Link to="/settings" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors">
                        <Settings size={18} />
                    </Link>
                </header>

                {/* --- 2. メインコンテンツ（スクロールエリア） --- */}
                <main className={`flex-1 overflow-y-auto transition-all duration-500 ${showEntry ? 'blur-sm scale-95 opacity-50' : 'opacity-100'}`}>
                    <div className="max-w-3xl mx-auto px-6 lg:px-12 w-full">
                        <Routes>
                            <Route path="/" element={<DashboardHome onOpenEntry={() => setShowEntry(true)} />} />
                            <Route path="/transactions" element={<TransactionEntry />} />
                            <Route path="/categories" element={<CategoryManagement />} />
                            <Route path="/invoices" element={<InvoiceBuilder />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </div>
                </main>

                {/* --- 3. ボトムナビゲーション（固定） --- */}
                <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-t border-[#3D2B1F]/5 px-8 flex justify-between items-center z-40 rounded-t-[32px] shadow-[0_-10px_40px_rgba(61,43,31,0.05)] max-w-3xl mx-auto w-full">
                    <NavItem to="/" icon={<Home size={22} />} label="ホーム" />
                    <NavItem to="/transactions" icon={<List size={22} />} label="履歴" />

                    {/* フローティングアクションボタン (FAB) */}
                    <div className="relative -top-10">
                        <button
                            onClick={() => setShowEntry(true)}
                            className="w-16 h-16 bg-[#3D2B1F] text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#F7F4F0] hover:scale-110 active:scale-95 transition-transform"
                        >
                            <Plus size={28} />
                        </button>
                    </div>

                    <NavItem to="/categories" icon={<PieChart size={22} />} label="カテゴリ" />
                    <NavItem to="/invoices" icon={<FileText size={22} />} label="請求書" />
                </nav>

                {/* --- 4. 入力画面（モーダル） --- */}
                {showEntry && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#3D2B1F]/20 backdrop-blur-sm">
                        <div className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                            <TransactionForm onClose={() => setShowEntry(false)} />
                        </div>
                    </div>
                )}

            </div>
        </Router>
    );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-[#3D2B1F]' : 'text-[#3D2B1F]/20 hover:text-[#3D2B1F]/50'}`}
        >
            {icon}
            <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
        </Link>
    );
};

export default AppRouter;
