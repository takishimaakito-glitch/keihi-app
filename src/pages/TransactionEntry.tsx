import TransactionTable from '../components/TransactionTable';
import type { EditTransactionData } from '../components/TransactionForm';

interface TransactionEntryProps {
    onOpenEntry?: (mode: "default" | "camera", initialData?: EditTransactionData | null) => void;
}

const TransactionEntry = ({ onOpenEntry }: TransactionEntryProps) => {
    return (
        <div className="space-y-6 pb-8">
            <header className="px-2">
                <h2 className="text-2xl font-black italic tracking-tighter">履歴</h2>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Transaction History</p>
            </header>
            <TransactionTable onOpenEntry={onOpenEntry} />
        </div>
    );
};

export default TransactionEntry;
