import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Types
const DEFAULT_CATEGORIES = [
    { id: "all", label: "すべて", icon: "📊", color: "text-slate-500", bg: "bg-slate-100", keywords: "" },
    { id: "supplies", label: "消耗品費", icon: "🛒", color: "text-pink-500", bg: "bg-pink-50", keywords: "衣装,服,機材,マイク,カメラ,備品,パソコン,文具" },
    { id: "meeting", label: "接待交際費", icon: "☕", color: "text-amber-600", bg: "bg-amber-50", keywords: "打ち合わせ,カフェ,レストラン,飲食,食事,差し入れ,手土産" },
    { id: "transport", label: "旅費交通費", icon: "🚃", color: "text-blue-500", bg: "bg-blue-50", keywords: "電車,バス,タクシー,新幹線,飛行機,駐車場,宿泊費" },
    { id: "communication", label: "通信費", icon: "📱", color: "text-emerald-500", bg: "bg-emerald-50", keywords: "スマホ代,携帯料金,インターネット,Webサービス,切手代" },
    { id: "rent", label: "地代家賃", icon: "🏠", color: "text-violet-500", bg: "bg-violet-50", keywords: "スタジオ代,レンタルスペース,家賃" },
    { id: "fees", label: "支払手数料", icon: "💳", color: "text-slate-500", bg: "bg-slate-50", keywords: "振込手数料,システム手数料,仲介手数料" },
    { id: "other", label: "雑費", icon: "📌", color: "text-slate-500", bg: "bg-slate-50", keywords: "その他少額の経費,クリーニング代" },
];

export interface Category {
    id: string;
    label: string;
    icon: string;
    color: string;
    bg: string;
    keywords: string;
}

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

    useEffect(() => {
        localStorage.setItem('keihi-categories', JSON.stringify(categories));
    }, [categories]);

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
        const { data, error } = await supabase.from('expenses').insert([expense]).select();
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
        const { data, error } = await supabase.from('incomes').insert([income]).select();
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
