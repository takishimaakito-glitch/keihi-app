import { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "すべて",            icon: "📊", color: "#6B7280", bg: "#F3F4F6" },
  { id: "costume",   label: "衣装・コスチューム", icon: "👗", color: "#DB6B8A", bg: "#FDF2F5" },
  { id: "meeting",   label: "打ち合わせ",         icon: "☕", color: "#C07A3A", bg: "#FDF6EE" },
  { id: "health",    label: "健康管理",           icon: "🌿", color: "#4A9B72", bg: "#F0FAF4" },
  { id: "transport", label: "交通費",             icon: "🚃", color: "#4A7BC4", bg: "#EFF5FD" },
  { id: "equipment", label: "機材・備品",         icon: "🎤", color: "#7C5FC4", bg: "#F5F0FD" },
  { id: "other",     label: "その他",             icon: "📌", color: "#8B8080", bg: "#F5F2F2" },
];

const SAMPLE_EXPENSES = [
  { id: 1, date: "2025-11-03", store: "コスチュームショップ ユニバース", amount: 12800, memo: "ユナイト公式衣装代",       category: "costume",   imageUrl: null },
  { id: 2, date: "2025-11-05", store: "スターバックス 渋谷店",           amount: 1640,  memo: "おぶやんさんとの打ち合わせ", category: "meeting",   imageUrl: null },
  { id: 3, date: "2025-11-07", store: "エニタイムフィットネス",            amount: 7700,  memo: "ジム月会費",             category: "health",    imageUrl: null },
  { id: 4, date: "2025-11-10", store: "JR東日本",                        amount: 2340,  memo: "ライブ会場への交通費",    category: "transport", imageUrl: null },
  { id: 5, date: "2026-01-15", store: "コスチュームショップ ユニバース", amount: 18000, memo: "新衣装代",               category: "costume",   imageUrl: null },
  { id: 6, date: "2026-02-03", store: "エニタイムフィットネス",            amount: 7700,  memo: "ジム月会費",             category: "health",    imageUrl: null },
];

const SAMPLE_INCOME = [
  { id: 101, date: "2025-10-31", client: "株式会社ユナイト",   amount: 150000, withholding: 15000, memo: "10月度出演料",    invoiceNo: "INV-2025-010" },
  { id: 102, date: "2025-11-30", client: "○○プロダクション", amount: 80000,  withholding: 8000,  memo: "11月撮影出演費", invoiceNo: "INV-2025-011" },
  { id: 103, date: "2025-11-15", client: "株式会社ユナイト",   amount: 50000,  withholding: 5000,  memo: "グッズ監修費",   invoiceNo: "INV-2025-012" },
  { id: 104, date: "2026-01-31", client: "株式会社ユナイト",   amount: 160000, withholding: 16000, memo: "1月度出演料",    invoiceNo: "INV-2026-001" },
  { id: 105, date: "2026-02-15", client: "○○プロダクション", amount: 90000,  withholding: 9000,  memo: "2月撮影出演費", invoiceNo: "INV-2026-002" },
];

const fmt    = (n) => `¥${Number(n).toLocaleString()}`;
const fmtDate = (s) => s?.replace(/-/g, "/") ?? "";
const getCat  = (id) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES[6];
const getYear = (dateStr) => dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
const THIS_YEAR = new Date().getFullYear();

// ─────────────────────────────────────────────────────────
// 共通コンポーネント
// ─────────────────────────────────────────────────────────
function Badge({ categoryId, small }) {
  const cat = getCat(categoryId);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 8px" : "4px 12px",
      borderRadius: 999, fontSize: small ? 11 : 12, fontWeight: 600,
      background: cat.bg, color: cat.color,
    }}>
      {cat.icon} {cat.label}
    </span>
  );
}

function InputField({ label, value, onChange, type = "text", onFocus, onBlur }) {
  const base = {
    width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#FDFBF8",
    outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value ?? ""} onChange={onChange} style={base}
        onFocus={e => { e.target.style.borderColor = "#A08F7A"; onFocus?.(); }}
        onBlur={e =>  { e.target.style.borderColor = "#E8E2D8"; onBlur?.(); }} />
    </div>
  );
}

function SectionCard({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "20px 20px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)", ...style
    }}>
      {children}
    </div>
  );
}

function ImageModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 500, width: "100%" }}>
        <img src={url} alt="preview" style={{ width: "100%", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }} />
        <button onClick={onClose} style={{
          position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%",
          background: "#fff", border: "none", cursor: "pointer", fontSize: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 経費カード
// ─────────────────────────────────────────────────────────
function ExpenseCard({ exp, onDelete, onImageClick }) {
  const cat = getCat(exp.category);
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "16px 18px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10,
      display: "flex", gap: 14, alignItems: "flex-start",
      borderLeft: `4px solid ${cat.color}`, transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
    >
      <div onClick={() => exp.imageUrl && onImageClick(exp.imageUrl)} style={{
        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
        background: exp.imageUrl ? `url(${exp.imageUrl}) center/cover` : cat.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, cursor: exp.imageUrl ? "pointer" : "default",
        border: exp.imageUrl ? `2px solid ${cat.color}44` : "none",
      }}>
        {!exp.imageUrl && cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.store}</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{exp.memo}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(exp.date)}</span>
          <Badge categoryId={exp.category} small />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>{fmt(exp.amount)}</div>
        <button onClick={() => onDelete(exp.id)} style={{ background: "none", border: "1px solid #e5e5e5", color: "#bbb", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>削除</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 収入カード
// ─────────────────────────────────────────────────────────
function IncomeCard({ inc, onDelete }) {
  const net = inc.amount - (inc.withholding || 0);
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "16px 18px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10,
      borderLeft: "4px solid #4A9B72", transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{inc.client}</span>
            {inc.invoiceNo && (
              <span style={{ fontSize: 11, color: "#aaa", background: "#F5F5F5", padding: "1px 8px", borderRadius: 6 }}>{inc.invoiceNo}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{inc.memo}</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(inc.date)}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{fmt(inc.amount)}</div>
          {inc.withholding > 0 && (
            <div style={{ fontSize: 12, color: "#C07A3A", marginTop: 2 }}>
              源泉 {fmt(inc.withholding)}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#4A9B72", fontWeight: 600, marginTop: 2 }}>
            手取 {fmt(net)}
          </div>
          <button onClick={() => onDelete(inc.id)} style={{ marginTop: 6, background: "none", border: "1px solid #e5e5e5", color: "#bbb", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>削除</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 収入タブ — PDF読み取り
// ─────────────────────────────────────────────────────────
function IncomeTab({ incomes, setIncomes, selectedYear }) {
  const [reading, setReading]       = useState(false);
  const [editInc, setEditInc]       = useState(null);
  const [error, setError]           = useState(null);
  const [pdfName, setPdfName]       = useState(null);
  const [filterClient, setFilter]   = useState("all");
  const [viewMode, setViewMode]     = useState("list"); // "list" | "upload"
  const fileRef = useRef();
  const nextId  = useRef(300);

  // クライアント一覧
  const yearIncomes = incomes.filter(i => getYear(i.date) === selectedYear);
  const clients = ["all", ...Array.from(new Set(yearIncomes.map(i => i.client)))];

  // 集計
  const filtered    = filterClient === "all" ? yearIncomes : yearIncomes.filter(i => i.client === filterClient);
  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0);
  const totalWith   = filtered.reduce((s, i) => s + (i.withholding || 0), 0);

  // 会社ごとのサマリー
  const byCo = Array.from(
    yearIncomes.reduce((map, i) => {
      const prev = map.get(i.client) || { count: 0, amount: 0, withholding: 0 };
      map.set(i.client, { count: prev.count + 1, amount: prev.amount + i.amount, withholding: prev.withholding + (i.withholding || 0) });
      return map;
    }, new Map())
  ).map(([client, v]) => ({ client, ...v }));

  const handlePDF = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("PDFファイルを選択してください");
      return;
    }
    setError(null);
    setPdfName(file.name);
    setReading(true);
    setEditInc(null);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 }
              },
              {
                type: "text",
                text: `この請求書PDFから情報を抽出してJSONのみ返してください（前置き・説明・バッククォート不要）:
{
  "date": "YYYY-MM-DD（請求日または支払期日）",
  "client": "発注元の会社名・依頼主名",
  "amount": 数値（税込合計金額）,
  "withholding": 数値（源泉徴収税額、なければ0）,
  "memo": "業務内容の簡潔な説明",
  "invoiceNo": "請求書番号（なければ空文字）"
}`
              }
            ]
          }]
        })
      });

      const data = await resp.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setEditInc({ ...parsed, id: nextId.current++ });
    } catch (e) {
      setError("PDFの読み取りに失敗しました。別のファイルを試してください。");
    } finally {
      setReading(false);
    }
  }, []);

  const saveIncome = () => {
    if (!editInc) return;
    setIncomes(p => [editInc, ...p]);
    setEditInc(null);
    setPdfName(null);
    setViewMode("list");
  };

  const deleteIncome = (id) => setIncomes(p => p.filter(i => i.id !== id));

  const exportIncomeCSV = () => {
    const rows = [
      "支払日,取引先,請求書番号,売上金額,源泉徴収額,手取り,内容",
      ...yearIncomes.map(i => `${fmtDate(i.date)},${i.client},${i.invoiceNo || ""},${i.amount},${i.withholding || 0},${i.amount - (i.withholding || 0)},${i.memo}`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `収入データ_${selectedYear}年_確定申告用.csv`;
    a.click();
  };

  return (
    <div className="card-anim">
      {/* サマリーバナー */}
      <div style={{
        background: "linear-gradient(135deg, #2D5A3D 0%, #4A9B72 100%)",
        borderRadius: 22, padding: "20px 22px", marginBottom: 16,
        boxShadow: "0 4px 24px rgba(45,90,61,0.25)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginBottom: 4 }}>
          {filterClient === "all" ? "年間収入合計" : filterClient}
        </div>
        <div style={{ color: "#fff", fontSize: 34, fontWeight: 900, letterSpacing: -1, marginBottom: 10 }}>
          {fmt(totalAmount)}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>源泉徴収合計</div>
            <div style={{ color: "#FFD580", fontWeight: 700, fontSize: 15 }}>{fmt(totalWith)}</div>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>手取り合計</div>
            <div style={{ color: "#A8F0C6", fontWeight: 700, fontSize: 15 }}>{fmt(totalAmount - totalWith)}</div>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>件数</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{filtered.length}件</div>
          </div>
        </div>
      </div>

      {/* 会社別サマリー */}
      {byCo.length > 0 && (
        <SectionCard style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4A3A", marginBottom: 12 }}>🏢 会社別まとめ</div>
          {byCo.map(c => (
            <div key={c.client} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid #F5F0E8"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{c.client}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{c.count}件 · 源泉 {fmt(c.withholding)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{fmt(c.amount)}</div>
                <div style={{ fontSize: 12, color: "#4A9B72", fontWeight: 600 }}>手取 {fmt(c.amount - c.withholding)}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* 操作バー */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setViewMode(viewMode === "upload" ? "list" : "upload")} style={{
          flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
          background: viewMode === "upload" ? "#4A9B72" : "#E8F5EE",
          color: viewMode === "upload" ? "#fff" : "#4A9B72",
          fontWeight: 700, fontSize: 14, transition: "all 0.2s"
        }}>
          {viewMode === "upload" ? "✕ 閉じる" : "＋ 請求書を追加"}
        </button>
        <button onClick={exportIncomeCSV} style={{
          padding: "11px 16px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "#F0EBE0", color: "#7A6A55", fontWeight: 600, fontSize: 13
        }}>
          📥 CSV
        </button>
      </div>

      {/* アップロードセクション */}
      {viewMode === "upload" && (
        <div style={{ marginBottom: 16, animation: "fadeUp 0.25s ease" }}>
          <SectionCard>
            <div style={{ fontWeight: 700, color: "#2D5A3D", fontSize: 15, marginBottom: 14 }}>📄 請求書PDF読み取り</div>

            {!pdfName ? (
              <div
                onClick={() => fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handlePDF(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: "2px dashed #B8D8C4", borderRadius: 16, padding: "40px 20px",
                  textAlign: "center", cursor: "pointer", background: "#F5FBF7",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#4A9B72"; e.currentTarget.style.background = "#EEF8F2"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#B8D8C4"; e.currentTarget.style.background = "#F5FBF7"; }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D5A3D", marginBottom: 6 }}>請求書PDFをアップロード</div>
                <div style={{ fontSize: 13, color: "#8AAF96" }}>タップまたはドラッグ＆ドロップ</div>
                <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
                  onChange={e => handlePDF(e.target.files[0])} />
              </div>
            ) : (
              <div style={{
                background: "#F5FBF7", borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12, marginBottom: 8
              }}>
                <span style={{ fontSize: 28 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#2D5A3D" }}>{pdfName}</div>
                  <div style={{ fontSize: 12, color: "#8AAF96" }}>読み取り済み</div>
                </div>
                <button onClick={() => { setPdfName(null); setEditInc(null); }} style={{
                  background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18
                }}>✕</button>
              </div>
            )}

            {reading && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 30, display: "inline-block", animation: "spin 1.2s linear infinite", marginBottom: 8 }}>⚙️</div>
                <div style={{ color: "#2D5A3D", fontWeight: 600 }}>AIがPDFを読み取り中…</div>
              </div>
            )}

            {error && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#C05050", fontSize: 14, marginTop: 8 }}>
                ⚠️ {error}
              </div>
            )}
          </SectionCard>

          {/* 編集フォーム */}
          {editInc && (
            <SectionCard style={{ marginTop: 12, animation: "fadeUp 0.25s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontWeight: 700, color: "#4A9B72", fontSize: 15 }}>読み取り完了！内容を確認してください</span>
              </div>

              <InputField label="📅 支払日" value={editInc.date} type="date"
                onChange={e => setEditInc(p => ({ ...p, date: e.target.value }))} />
              <InputField label="🏢 取引先（会社名）" value={editInc.client}
                onChange={e => setEditInc(p => ({ ...p, client: e.target.value }))} />
              <InputField label="📝 業務内容" value={editInc.memo}
                onChange={e => setEditInc(p => ({ ...p, memo: e.target.value }))} />
              <InputField label="🔖 請求書番号" value={editInc.invoiceNo}
                onChange={e => setEditInc(p => ({ ...p, invoiceNo: e.target.value }))} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>💰 売上金額</label>
                  <input type="number" value={editInc.amount ?? ""} onChange={e => setEditInc(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))}
                    style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 12px", fontSize: 15, fontWeight: 700, color: "#1A1714", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#4A9B72"}
                    onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>🏦 源泉徴収額</label>
                  <input type="number" value={editInc.withholding ?? ""} onChange={e => setEditInc(p => ({ ...p, withholding: parseInt(e.target.value) || 0 }))}
                    style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 12px", fontSize: 15, fontWeight: 700, color: "#C07A3A", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#C07A3A"}
                    onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                </div>
              </div>

              {/* 手取りプレビュー */}
              <div style={{ background: "#F0FAF4", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#4A9B72", fontWeight: 600 }}>手取り金額</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#2D5A3D" }}>
                  {fmt((editInc.amount || 0) - (editInc.withholding || 0))}
                </span>
              </div>

              <button onClick={saveIncome} style={{
                width: "100%", background: "linear-gradient(135deg, #2D5A3D, #4A9B72)",
                color: "#fff", border: "none", padding: "15px", borderRadius: 14,
                fontWeight: 800, fontSize: 16, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(45,90,61,0.3)"
              }}>
                保存する
              </button>
            </SectionCard>
          )}
        </div>
      )}

      {/* クライアントフィルター */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 12, scrollbarWidth: "none" }}>
        {clients.map(c => {
          const active = filterClient === c;
          return (
            <button key={c} onClick={() => setFilter(c)} style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13, transition: "all 0.2s",
              background: active ? "#4A9B72" : "#fff",
              color: active ? "#fff" : "#888",
              boxShadow: active ? "0 2px 8px rgba(74,155,114,0.4)" : "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {c === "all" ? "🏢 すべて" : c}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>
        {filterClient !== "all" && `${filterClient} · `}{filtered.length}件 · 合計 {fmt(totalAmount)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          請求書データがありません
        </div>
      )}
      {filtered.map(inc => (
        <IncomeCard key={inc.id} inc={inc} onDelete={deleteIncome} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// メインアプリ
// ─────────────────────────────────────────────────────────
export default function App() {
  const [expenses, setExpenses]     = useState(SAMPLE_EXPENSES);
  const [incomes, setIncomes]       = useState(SAMPLE_INCOME);
  const [selectedYear, setSelectedYear] = useState(THIS_YEAR);
  const [mainTab, setMainTab]       = useState("expense");  // "expense" | "income" | "summary"
  const [expTab, setExpTab]         = useState("list");     // "list" | "scan"
  const [filterCat, setFilterCat]   = useState("all");
  const [scanning, setScanning]     = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editEntry, setEditEntry]   = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [error, setError]           = useState(null);
  const fileRef = useRef();
  const nextId  = useRef(200);

  // ── レシートスキャン処理 ──
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    setEditEntry(null);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
              { type: "text", text: `レシートからJSONのみ返してください（説明不要）:
{"date":"YYYY-MM-DD","store":"店名","amount":数値,"memo":"内容","category":"costume|meeting|health|transport|equipment|other"}
category: costume=衣装/服, meeting=カフェ/飲食, health=ジム/健康, transport=交通, equipment=機材/備品, other=その他` }
            ]
          }]
        })
      });

      const data = await resp.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setEditEntry({ ...parsed, id: nextId.current++, imageUrl: url });
    } catch {
      setError("読み取りに失敗しました。もう一度お試しください。");
    } finally {
      setScanning(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const saveEntry = () => {
    if (!editEntry) return;
    setExpenses(p => [editEntry, ...p]);
    setEditEntry(null);
    setPreviewUrl(null);
    setExpTab("list");
  };

  const cancelScan = () => { setEditEntry(null); setPreviewUrl(null); setError(null); };
  const deleteExpense = (id) => setExpenses(p => p.filter(e => e.id !== id));

  // 集計（選択年のみ）
  const yearExpenses = expenses.filter(e => getYear(e.date) === selectedYear);
  const yearIncomes  = incomes.filter(i => getYear(i.date) === selectedYear);
  const grandExpense = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const grandIncome  = yearIncomes.reduce((s, i) => s + i.amount, 0);
  const grandWith    = yearIncomes.reduce((s, i) => s + (i.withholding || 0), 0);
  const filtered     = filterCat === "all" ? yearExpenses : yearExpenses.filter(e => e.category === filterCat);
  const catTotals    = CATEGORIES.filter(c => c.id !== "all")
    .map(c => ({ ...c, total: yearExpenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.total > 0);

  // 利用可能な年リスト（データから自動生成）
  const availableYears = Array.from(new Set([
    ...expenses.map(e => getYear(e.date)),
    ...incomes.map(i => getYear(i.date)),
    THIS_YEAR,
  ])).filter(Boolean).sort((a, b) => b - a);

  const exportExpenseCSV = () => {
    const rows = ["発生日,勘定科目,税区分,金額,備考,取引先",
      ...yearExpenses.map(e => `${fmtDate(e.date)},${getCat(e.category).label},課税仕入10%,${e.amount},${e.memo},${e.store}`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `経費データ_${selectedYear}年.csv`; a.click();
  };

  // ── メインタブ定義 ──
  const MAIN_TABS = [
    { id: "expense", label: "💳 経費" },
    { id: "income",  label: "💴 収入" },
    { id: "summary", label: "📊 申告" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1", fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        button, input, select { font-family: inherit; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .card-anim { animation: fadeUp 0.32s ease both; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ヘッダー */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EEEBE4", padding: "18px 24px 14px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1A1714", letterSpacing: -0.5 }}>💼 経費管理</h1>
              <p style={{ margin: "1px 0 0", fontSize: 12, color: "#bbb" }}>たきしまさん専用</p>
            </div>
            {mainTab === "expense" && (
              <button onClick={exportExpenseCSV} style={{
                background: "#F0EBE0", border: "none", color: "#7A6A55",
                padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>📥 CSV</button>
            )}
          </div>

          {/* 年セレクター */}
          <div style={{ display: "flex", gap: 6 }}>
            {availableYears.map(year => {
              const active = selectedYear === year;
              return (
                <button key={year} onClick={() => setSelectedYear(year)} style={{
                  padding: "5px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                  background: active ? "#5B4A3A" : "#F0EBE0",
                  color: active ? "#fff" : "#9A8A7A",
                  boxShadow: active ? "0 2px 8px rgba(91,74,58,0.3)" : "none",
                }}>
                  {year}年
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 100px" }}>

        {/* メインタブ */}
        <div style={{ display: "flex", background: "#EEEAE2", borderRadius: 16, padding: 4, margin: "18px 0 20px" }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              flex: 1, padding: "11px 8px", border: "none", borderRadius: 12, cursor: "pointer",
              fontWeight: 700, fontSize: 13, transition: "all 0.2s",
              background: mainTab === t.id ? "#fff" : "transparent",
              color: mainTab === t.id ? "#5B4A3A" : "#9A8F83",
              boxShadow: mainTab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ══ 経費タブ ══ */}
        {mainTab === "expense" && (
          <>
            {/* サマリーカード */}
            <div className="card-anim" style={{
              background: "linear-gradient(135deg, #5B4A3A 0%, #7C6652 100%)",
              borderRadius: 22, padding: "20px 22px", marginBottom: 16,
              boxShadow: "0 4px 24px rgba(91,74,58,0.25)",
            }}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 4 }}>今月の経費合計</div>
              <div style={{ color: "#fff", fontSize: 34, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
                {fmt(grandExpense)}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {catTotals.map(c => (
                  <div key={c.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 13 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* サブタブ（一覧 / スキャン） */}
            <div style={{ display: "flex", background: "#EEEAE2", borderRadius: 12, padding: 3, marginBottom: 18 }}>
              {[["list", "📋 一覧"], ["scan", "📷 スキャン"]].map(([t, label]) => (
                <button key={t} onClick={() => setExpTab(t)} style={{
                  flex: 1, padding: "9px", border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                  background: expTab === t ? "#fff" : "transparent",
                  color: expTab === t ? "#5B4A3A" : "#9A8F83",
                  boxShadow: expTab === t ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                }}>{label}</button>
              ))}
            </div>

            {/* 一覧 */}
            {expTab === "list" && (
              <div className="card-anim">
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 14, scrollbarWidth: "none" }}>
                  {CATEGORIES.map(c => {
                    const active = filterCat === c.id;
                    return (
                      <button key={c.id} onClick={() => setFilterCat(c.id)} style={{
                        flexShrink: 0, padding: "6px 13px", borderRadius: 999, border: "none", cursor: "pointer",
                        fontWeight: 600, fontSize: 12, transition: "all 0.2s",
                        background: active ? getCat(c.id).color : "#fff",
                        color: active ? "#fff" : "#888",
                        boxShadow: active ? `0 2px 8px ${getCat(c.id).color}55` : "0 1px 4px rgba(0,0,0,0.06)",
                      }}>{c.icon} {c.label}</button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>
                  {filterCat !== "all" && `${getCat(filterCat).label} · `}{filtered.length}件 · 合計 {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
                </div>
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>データがありません
                  </div>
                )}
                {filtered.map(exp => (
                  <ExpenseCard key={exp.id} exp={exp} onDelete={deleteExpense} onImageClick={setLightboxUrl} />
                ))}
              </div>
            )}

            {/* スキャン */}
            {expTab === "scan" && (
              <div className="card-anim">
                {!previewUrl ? (
                  <div
                    onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current.click()}
                    style={{
                      border: "2px dashed #D4C9B8", borderRadius: 20, padding: "52px 24px",
                      textAlign: "center", cursor: "pointer", background: "#FDFBF8", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#A08F7A"; e.currentTarget.style.background = "#F7F3EE"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#D4C9B8"; e.currentTarget.style.background = "#FDFBF8"; }}
                  >
                    <div style={{ fontSize: 52, marginBottom: 14 }}>📸</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#5B4A3A", marginBottom: 8 }}>レシートをアップロード</div>
                    <div style={{ fontSize: 13, color: "#AEA79F" }}>タップして選択 または ドラッグ＆ドロップ</div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                ) : (
                  <div>
                    <SectionCard>
                      <img src={previewUrl} onClick={() => setLightboxUrl(previewUrl)}
                        style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block", cursor: "zoom-in", background: "#F8F6F1", borderRadius: 12, marginBottom: 10 }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#aaa" }}>タップで拡大</span>
                        <button onClick={cancelScan} style={{ background: "none", border: "none", color: "#C07A8A", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>✕ やり直す</button>
                      </div>
                    </SectionCard>
                    {scanning && (
                      <div style={{ textAlign: "center", padding: "28px 0" }}>
                        <div style={{ fontSize: 30, display: "inline-block", animation: "spin 1.2s linear infinite", marginBottom: 8 }}>⚙️</div>
                        <div style={{ color: "#7A6A55", fontWeight: 600 }}>AIが読み取り中…</div>
                      </div>
                    )}
                    {error && <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#C05050", fontSize: 14, marginTop: 10 }}>⚠️ {error}</div>}
                  </div>
                )}

                {editEntry && (
                  <SectionCard style={{ marginTop: 14, animation: "fadeUp 0.3s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <span style={{ fontWeight: 700, color: "#4A9B72", fontSize: 14 }}>読み取り完了！内容を確認してください</span>
                    </div>
                    {[{ key: "date", label: "📅 日付", type: "date" }, { key: "store", label: "🏪 店名", type: "text" }, { key: "memo", label: "📝 内容", type: "text" }].map(({ key, label, type }) => (
                      <InputField key={key} label={label} value={editEntry[key]} type={type}
                        onChange={e => setEditEntry(p => ({ ...p, [key]: e.target.value }))} />
                    ))}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>💰 金額</label>
                      <input type="number" value={editEntry.amount ?? ""} onChange={e => setEditEntry(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))}
                        style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 15, fontWeight: 700, color: "#1A1714", background: "#FDFBF8", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8, fontWeight: 600 }}>🏷️ カテゴリ</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {CATEGORIES.filter(c => c.id !== "all").map(cat => {
                          const active = editEntry.category === cat.id;
                          return (
                            <button key={cat.id} onClick={() => setEditEntry(p => ({ ...p, category: cat.id }))} style={{
                              padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                              border: active ? `2px solid ${cat.color}` : "2px solid #EEE",
                              background: active ? cat.bg : "#fff",
                              color: active ? cat.color : "#999",
                              fontWeight: active ? 700 : 500, fontSize: 12, transition: "all 0.15s"
                            }}>{cat.icon} {cat.label}</button>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={saveEntry} style={{
                      width: "100%", background: "linear-gradient(135deg, #5B4A3A, #7C6652)",
                      color: "#fff", border: "none", padding: "14px", borderRadius: 14,
                      fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(91,74,58,0.3)"
                    }}>保存する</button>
                  </SectionCard>
                )}
              </div>
            )}
          </>
        )}

        {/* ══ 収入タブ ══ */}
        {mainTab === "income" && (
          <IncomeTab incomes={incomes} setIncomes={setIncomes} selectedYear={selectedYear} />
        )}

        {/* ══ 申告サマリータブ ══ */}
        {mainTab === "summary" && (
          <div className="card-anim">
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>
              {selectedYear}年のデータをもとに確定申告に必要な数字をまとめています
            </div>

            {/* 年間収支 */}
            <SectionCard style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A", marginBottom: 14 }}>📊 {selectedYear}年 収支サマリー</div>
              {[
                { label: "売上合計（収入）",    value: grandIncome,                    color: "#2D5A3D", big: true },
                { label: "経費合計",            value: grandExpense,                   color: "#C07A3A" },
                { label: "課税対象（概算）",    value: grandIncome - grandExpense,     color: "#5B4A3A", big: true, border: true },
                { label: "源泉徴収された税額",  value: grandWith,                      color: "#4A7BC4" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0",
                  borderTop: row.border ? "2px solid #5B4A3A33" : "1px solid #F5F0E8",
                  marginTop: row.border ? 4 : 0
                }}>
                  <span style={{ fontSize: 14, color: "#444" }}>{row.label}</span>
                  <span style={{ fontWeight: row.big ? 800 : 600, fontSize: row.big ? 20 : 16, color: row.color }}>
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </SectionCard>

            {/* 経費内訳 */}
            <SectionCard style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A", marginBottom: 14 }}>💳 経費カテゴリ別内訳</div>
              {CATEGORIES.filter(c => c.id !== "all").map(cat => {
                const total = yearExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0);
                if (!total) return null;
                const pct = grandExpense > 0 ? Math.round(total / grandExpense * 100) : 0;
                return (
                  <div key={cat.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#444" }}>{cat.icon} {cat.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{fmt(total)}</span>
                    </div>
                    <div style={{ height: 6, background: "#F0EBE4", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </SectionCard>

            {/* 会社別収入 */}
            <SectionCard style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A", marginBottom: 14 }}>🏢 取引先別収入</div>
              {Array.from(yearIncomes.reduce((map, i) => {
                const v = map.get(i.client) || { amount: 0, withholding: 0, count: 0 };
                map.set(i.client, { amount: v.amount + i.amount, withholding: v.withholding + (i.withholding || 0), count: v.count + 1 });
                return map;
              }, new Map())).map(([client, v]) => (
                <div key={client} style={{ padding: "10px 0", borderBottom: "1px solid #F5F0E8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{client}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{v.count}件 · 源泉 {fmt(v.withholding)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{fmt(v.amount)}</div>
                      <div style={{ fontSize: 12, color: "#4A9B72" }}>手取 {fmt(v.amount - v.withholding)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </SectionCard>

            {/* CSV一括ダウンロード */}
            <SectionCard>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A", marginBottom: 12 }}>📥 申告用データ出力</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={exportExpenseCSV} style={{
                  flex: 1, background: "#F0EBE0", border: "none", color: "#7A6A55",
                  padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 13
                }}>💳 経費CSV</button>
                <button onClick={() => {
                  const rows = ["支払日,取引先,請求書番号,売上金額,源泉徴収額,手取り,内容",
                    ...yearIncomes.map(i => `${fmtDate(i.date)},${i.client},${i.invoiceNo || ""},${i.amount},${i.withholding || 0},${i.amount - (i.withholding || 0)},${i.memo}`)
                  ];
                  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `収入データ_${selectedYear}年_確定申告用.csv`; a.click();
                }} style={{
                  flex: 1, background: "#E8F5EE", border: "none", color: "#2D5A3D",
                  padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 13
                }}>💴 収入CSV</button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* ライトボックス */}
      <ImageModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
