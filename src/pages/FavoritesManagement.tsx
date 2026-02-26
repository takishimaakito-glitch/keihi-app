import { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { Favorite } from '../contexts/AppContext';

const ICONS_LIST = ["☕️", "🚕", "📦", "🍱", "📚", "💻", "🚄", "✈️", "🏠", "💡", "🎮", "📱"];

const FavoritesManagement = () => {
    const { favorites, setFavorites, categories } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Favorite State
    const [newFavLabel, setNewFavLabel] = useState('');
    const [newFavIcon, setNewFavIcon] = useState('☕️');
    const [newFavCategory, setNewFavCategory] = useState('');
    const [newFavStore, setNewFavStore] = useState('');
    const [newFavMemo, setNewFavMemo] = useState('');

    const handleAddFavorite = () => {
        if (!newFavLabel.trim() || !newFavCategory) return;

        const newFav: Favorite = {
            id: `fav_${Date.now()}`,
            label: newFavLabel,
            icon: newFavIcon,
            category: newFavCategory,
            store: newFavStore,
            memo: newFavMemo
        };

        setFavorites(prev => [...prev, newFav]);
        setIsAddModalOpen(false);
        setNewFavLabel('');
        setNewFavStore('');
        setNewFavMemo('');
        setNewFavCategory('');
    };

    const handleDeleteFavorite = (id: string) => {
        if (window.confirm('このいつものセットを削除しますか？')) {
            setFavorites(prev => prev.filter(f => f.id !== id));
        }
    };

    const getCategoryLabel = (catId: string) => {
        return categories.find(c => c.id === catId)?.label || catId;
    };

    return (
        <div className="space-y-6 pb-8 text-[#3D2B1F]">
            <header className="px-2 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">いつものセット</h2>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Shortcuts</p>
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
                    {favorites.map((fav) => (
                        <div key={fav.id} className="group bg-[#F7F4F0]/40 p-5 rounded-[32px] hover:bg-[#F7F4F0] border-2 border-transparent hover:border-[#3D2B1F]/5 transition-all cursor-pointer relative flex flex-col items-center justify-center text-center">

                            <div className="text-4xl mb-3 mt-2">{fav.icon}</div>

                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFavorite(fav.id); }} className="absolute top-3 right-3 p-2 bg-white rounded-full text-[#3D2B1F]/20 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                                <X size={14} />
                            </button>

                            <h3 className="font-black text-sm">{fav.label}</h3>
                            <p className="text-[10px] font-bold opacity-30 mt-1 truncate w-full px-2">{fav.store}</p>
                            <span className="text-[8px] font-black opacity-40 bg-white px-2 py-0.5 rounded border border-[#3D2B1F]/5 mt-2">
                                {getCategoryLabel(fav.category)}
                            </span>
                        </div>
                    ))}
                    {favorites.length === 0 && (
                        <div className="col-span-2 sm:col-span-3 text-center py-12 text-[#3D2B1F]/30 text-sm font-bold">
                            いつものセットはまだありません
                        </div>
                    )}
                </div>

                <div className="mt-10 bg-[#3D2B1F]/5 rounded-[32px] p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#3D2B1F] shadow-sm mb-4">
                        <Star size={20} />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 opacity-50">Tips</h4>
                    <p className="text-xs font-bold leading-relaxed opacity-60">
                        入力画面（手入力）でよく使う、取引先・カテゴリ・メモの組み合わせを登録しておくと、1タップで入力が終わるようになります。
                    </p>
                </div>
            </div>

            {/* Add Favorite Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-[#3D2B1F]/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="px-8 py-6 flex justify-between items-center bg-[#F7F4F0]/50 shrink-0">
                            <h3 className="font-black text-sm">セット追加</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="bg-[#F7F4F0] rounded-[32px] p-6 flex flex-col items-center justify-center">
                                <span className="text-5xl">{newFavIcon}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto pr-2 hide-scrollbar">
                                {ICONS_LIST.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => setNewFavIcon(icon)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all ${newFavIcon === icon ? 'bg-[#3D2B1F] text-white shadow-md scale-110' : 'bg-[#F7F4F0] hover:bg-[#3D2B1F]/10'}`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#F7F4F0]">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">表示名 (必須)</label>
                                    <input
                                        type="text"
                                        value={newFavLabel}
                                        onChange={(e) => setNewFavLabel(e.target.value)}
                                        placeholder="例：スタバ打ち合わせ"
                                        className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">カテゴリ (必須)</label>
                                    <select
                                        value={newFavCategory}
                                        onChange={(e) => setNewFavCategory(e.target.value)}
                                        className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] appearance-none"
                                    >
                                        <option value="" disabled>選択してください</option>
                                        {categories.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">支払先</label>
                                    <input
                                        type="text"
                                        value={newFavStore}
                                        onChange={(e) => setNewFavStore(e.target.value)}
                                        placeholder="例：スターバックスコーヒー"
                                        className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold opacity-40 ml-2">メモ</label>
                                    <input
                                        type="text"
                                        value={newFavMemo}
                                        onChange={(e) => setNewFavMemo(e.target.value)}
                                        placeholder="例：〇〇プロジェクト打ち合わせ"
                                        className="w-full bg-[#F7F4F0]/50 px-6 py-4 rounded-[24px] text-sm font-bold outline-none focus:bg-[#F7F4F0] placeholder:text-[#3D2B1F]/30"
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="p-8 pt-0 mt-auto shrink-0">
                            <button
                                onClick={handleAddFavorite}
                                disabled={!newFavLabel.trim() || !newFavCategory}
                                className={`w-full py-4 rounded-[24px] font-black text-sm transition-all shadow-xl flex items-center justify-center ${newFavLabel.trim() && newFavCategory ? 'bg-[#3D2B1F] text-white hover:bg-black hover:-translate-y-1' : 'bg-[#3D2B1F]/5 text-[#3D2B1F]/30 cursor-not-allowed shadow-none'}`}
                            >
                                <Plus size={18} className="mr-2" /> 登録する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FavoritesManagement;
