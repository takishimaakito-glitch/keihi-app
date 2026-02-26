import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Types
const DEFAULT_CATEGORIES = [
    { id: "all", label: "すべて", icon: "📊", color: "text-slate-500", bg: "bg-slate-100", keywords: "", allowRatio: false },
    { id: "supplies", label: "消耗品費", icon: "🛒", color: "text-pink-500", bg: "bg-pink-50", keywords: "衣装,服,機材,マイク,カメラ,備品,パソコン,文具", allowRatio: true },
    { id: "meeting", label: "接待交際費", icon: "☕", color: "text-amber-600", bg: "bg-amber-50", keywords: "打ち合わせ,カフェ,レストラン,飲食,食事,差し入れ,手土産", allowRatio: false },
    { id: "transport", label: "旅費交通費", icon: "🚃", color: "text-blue-500", bg: "bg-blue-50", keywords: "電車,バス,タクシー,新幹線,飛行機,駐車場,宿泊費", allowRatio: false },
    { id: "communication", label: "通信費", icon: "📱", color: "text-emerald-500", bg: "bg-emerald-50", keywords: "スマホ代,携帯料金,インターネット,Webサービス,切手代", allowRatio: true },
    { id: "rent", label: "地代家賃", icon: "🏠", color: "text-violet-500", bg: "bg-violet-50", keywords: "スタジオ代,レンタルスペース,家賃", allowRatio: true },
    { id: "fees", label: "支払手数料", icon: "💳", color: "text-slate-500", bg: "bg-slate-50", keywords: "振込手数料,システム手数料,仲介手数料", allowRatio: false },
    { id: "other", label: "雑費", icon: "📌", color: "text-slate-500", bg: "bg-slate-50", keywords: "その他少額の経費,クリーニング代", allowRatio: true },
];

export interface Category {
    id: string;
    label: string;
    icon: string;
    color: string;
    bg: string;
    keywords: string;
    allowRatio?: boolean;
}

export interface Favorite {
    id: string;
    label: string;
    icon: string;
    category: string;
    store: string;
    memo: string;
}

const DEFAULT_FAVORITES: Favorite[] = [
    { id: 'fav_1', label: 'スタバ', icon: '☕️', category: 'meeting', store: 'スターバックスコーヒー', memo: '打ち合わせカフェ代' },
    { id: 'fav_2', label: 'タクシー', icon: '🚕', category: 'transport', store: 'GOタクシー', memo: '移動交通費' },
    { id: 'fav_3', label: 'Amazon', icon: '📦', category: 'supplies', store: 'Amazon.co.jp', memo: '事務用品' },
    { id: 'fav_4', label: 'ランチ', icon: '🍱', category: 'meeting', store: 'コンビニ', memo: '昼食代' },
];

export interface Expense {
    id: number;
    date: string;
    store: string;
    amount: number;
    memo: string;
    category: string;
    imageUrl?: string | null;
    ratio?: number;
    invoiceNo?: string;
    created_at?: string;
}

export interface Income {
    id: number;
    date: string;
    client: string;
    amount: number;
    withholding: number;
    memo: string;
    invoiceNo?: string;
    imageUrl?: string | null;
    created_at?: string;
}

interface AppContextType {
    expenses: Expense[];
    incomes: Income[];
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    apiKey: string;
    setApiKey: React.Dispatch<React.SetStateAction<string>>;
    fixedExpenses: any[];
    setFixedExpenses: React.Dispatch<React.SetStateAction<any[]>>;
    favorites: Favorite[];
    setFavorites: React.Dispatch<React.SetStateAction<Favorite[]>>;
    loading: boolean;
    refreshData: () => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<{ data: any; error: any }>;
    updateExpense: (id: number, expense: Partial<Expense>) => Promise<{ data: any; error: any }>;
    deleteExpense: (id: number) => Promise<{ error: any }>;
    addIncome: (income: Omit<Income, 'id'>) => Promise<{ data: any; error: any }>;
    updateIncome: (id: number, income: Partial<Income>) => Promise<{ data: any; error: any }>;
    deleteIncome: (id: number) => Promise<{ error: any }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);

    // Settings & Categories from LocalStorage
    const [categories, setCategories] = useState<Category[]>(() => {
        const saved = localStorage.getItem('keihi-categories');
        return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    });
    const [apiKey, setApiKey] = useState(() => localStorage.getItem("keihi-api-key") || "");
    const [fixedExpenses, setFixedExpenses] = useState<any[]>(() => {
        const saved = localStorage.getItem("keihi-fixed-expenses");
        return saved ? JSON.parse(saved) : [];
    });
    const [favorites, setFavorites] = useState<Favorite[]>(() => {
        const saved = localStorage.getItem("keihi-favorites");
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });

    useEffect(() => {
        localStorage.setItem('keihi-categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('keihi-api-key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem('keihi-favorites', JSON.stringify(favorites));
    }, [favorites]);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch Expenses
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (expensesError) {
                console.error('Error fetching expenses:', expensesError);
            } else {
                setExpenses(expensesData || []);
            }

            // Fetch Incomes (if table exists)
            // Assuming 'incomes' table exists based on original App.jsx logic
            const { data: incomesData, error: incomesError } = await supabase
                .from('incomes')
                .select('*')
                .order('date', { ascending: false });

            if (incomesError) {
                // If the table doesn't exist, this might fail, so we catch it silently
                console.warn('Error fetching incomes (table might not exist yet):', incomesError);
            } else {
                setIncomes(incomesData || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addExpense = async (expense: Omit<Expense, 'id'>) => {
        const nextId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
        const payload = { ...expense, id: nextId };
        const { data, error } = await supabase.from('expenses').insert([payload]).select();
        if (!error) await refreshData();
        return { data, error };
    };

    const updateExpense = async (id: number, expense: Partial<Expense>) => {
        const { data, error } = await supabase.from('expenses').update(expense).eq('id', id).select();
        if (!error) await refreshData();
        return { data, error };
    };

    const deleteExpense = async (id: number) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) await refreshData();
        return { error };
    };

    const addIncome = async (income: Omit<Income, 'id'>) => {
        const nextId = incomes.length > 0 ? Math.max(...incomes.map(i => i.id)) + 1 : 1;
        const payload = { ...income, id: nextId };
        const { data, error } = await supabase.from('incomes').insert([payload]).select();
        if (!error) await refreshData();
        return { data, error };
    };

    const updateIncome = async (id: number, income: Partial<Income>) => {
        const { data, error } = await supabase.from('incomes').update(income).eq('id', id).select();
        if (!error) await refreshData();
        return { data, error };
    };

    const deleteIncome = async (id: number) => {
        const { error } = await supabase.from('incomes').delete().eq('id', id);
        if (!error) await refreshData();
        return { error };
    };

    return (
        <AppContext.Provider
            value={{
                expenses,
                incomes,
                categories,
                setCategories,
                apiKey,
                setApiKey,
                fixedExpenses,
                setFixedExpenses,
                favorites,
                setFavorites,
                loading,
                refreshData,
                addExpense,
                updateExpense,
                deleteExpense,
                addIncome,
                updateIncome,
                deleteIncome,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
