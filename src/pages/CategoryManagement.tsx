import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { Category } from '../contexts/AppContext';

const ICONS_LIST = ["🛒", "👗", "☕", "🌿", "🚃", "🎤", "📌", "🎵", "📸", "✈️", "🎭", "🎁", "🏠", "💄", "📚", "🎨", "💊", "🍱", "🎮", "💻", "📱", "💳"];

const CategoryManagement = () => {
    const { categories, setCategories, expenses } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('📌');
    const [newCatKeywords, setNewCatKeywords] = useState('');

    const activeCategories = categories.filter(c => c.id !== 'all');

    // Calculate usage from expenses
    const getCategoryUsage = (catId: string) => {
        return expenses.filter(e => e.category === catId).length;
    };

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;

        const newCat: Category = {
            id: `cat_${Date.now()}`,
            label: newCatName,
            icon: newCatIcon,
            color: "text-[#3D2B1F]",
            bg: "bg-[#F7F4F0]",
            keywords: newCatKeywords
        };

        setCategories(prev => [...prev, newCat]);
        setIsAddModalOpen(false);
        setNewCatName('');
        setNewCatKeywords('');
    };

    const handleDeleteCategory = (id: string) => {
        if (id === 'other') return; // Cannot delete base category
        if (window.confirm('このカテゴリを削除しますか？\nすでにこのカテゴリが設定されている経費は「雑費」に分類されます。')) {
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-6 pb-8 text-[#3D2B1F]">
            <header className="px-2 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">カテゴリ</h2>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Categories</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex justify-center items-center w-12 h-12 bg-[#3D2B1F] text-white rounded-[20px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="bg-white rounded-[40px] p-6 shadow-sm border border-[#3D2B1F]/5 min-h-[50vh]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {activeCategories.map((cat) => (
                        <div key={cat.id} className="group bg-[#F7F4F0]/40 p-5 rounded-[32px] hover:bg-[#F7F4F0] border-2 border-transparent hover:border-[#3D2B1F]/5 transition-all cursor-pointer relative flex flex-col items-center justify-center text-center">

                            <div className="text-4xl mb-3 mt-2">{cat.icon}</div>

                            {cat.id !== "other" && cat.id !== "supplies" && cat.id !== "meeting" && cat.id !== "transport" && cat.id !== "communication" && cat.id !== "rent" && cat.id !== "fees" && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="absolute top-3 right-3 p-2 bg-white rounded-full text-[#3D2B1F]/20 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                                    <X size={14} />
                                </button>
                            )}

                            <h3 className="font-black text-sm">{cat.label}</h3>
                            <p className="text-[10px] font-bold opacity-30 mt-1 uppercase">{getCategoryUsage(cat.id)} entries</p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 bg-[#3D2B1F]/5 rounded-[32px] p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#3D2B1F] shadow-sm mb-4">
                        <Tag size={20} />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 opacity-50">Tips</h4>
                    <p className="text-xs font-bold leading-relaxed opacity-60">
                        細かいカテゴリ分けは管理コストが増加します。税務署に説明しやすいよう、「接待交際費」や「会議費」を明確に分けるのがおすすめです。
                    </p>
                </div>
            </div>

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-[#3D2B1F]/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 flex justify-between items-center bg-[#F7F4F0]/50 shrink-0">
                            <h3 className="font-black text-sm">カテゴリ追加</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-[#F7F4F0] rounded-[32px] p-6 flex flex-col items-center justify-center">
                                <span className="text-5xl">{newCatIcon}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto pr-2 hide-scrollbar">
                                {ICONS_LIST.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => setNewCatIcon(icon)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${newCatIcon === icon ? 'bg-[#3D2B1F] text-white shadow-md scale-110' : 'bg-[#F7F4F0] hover:bg-[#3D2B1F]/10'}`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#F7F4F0]">
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="カテゴリ名 (例：外注費)"
                                    className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30 text-center"
                                />
                                <input
                                    type="text"
                                    value={newCatKeywords}
                                    onChange={(e) => setNewCatKeywords(e.target.value)}
                                    placeholder="キーワード (例：デザイン, 撮影)"
                                    className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30 text-center"
                                />
                            </div>

                            <button
                                onClick={handleAddCategory}
                                disabled={!newCatName.trim()}
                                className={`w-full py-4 rounded-full font-black text-sm transition-all shadow-xl ${newCatName.trim() ? 'bg-[#3D2B1F] text-white hover:bg-black hover:-translate-y-1' : 'bg-[#3D2B1F]/10 text-[#3D2B1F]/30 cursor-not-allowed shadow-none'}`}
                            >
                                追加する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
