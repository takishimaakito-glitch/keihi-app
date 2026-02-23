import { useState, useRef, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "all", label: "すべて", icon: "📊", color: "#6B7280", bg: "#F3F4F6", keywords: "" },
  { id: "costume", label: "衣装・コスチューム", icon: "👗", color: "#DB6B8A", bg: "#FDF2F5", keywords: "衣装,コスチューム,服,アクセサリー,ウィッグ" },
  { id: "meeting", label: "打ち合わせ", icon: "☕", color: "#C07A3A", bg: "#FDF6EE", keywords: "カフェ,レストラン,飲食,コーヒー,食事,ランチ,ディナー" },
  { id: "health", label: "健康管理", icon: "🌿", color: "#4A9B72", bg: "#F0FAF4", keywords: "ジム,フィットネス,スポーツ,健康,プロテイン,サプリ" },
  { id: "transport", label: "交通費", icon: "🚃", color: "#4A7BC4", bg: "#EFF5FD", keywords: "電車,バス,タクシー,交通,新幹線,飛行機,駐車場" },
  { id: "equipment", label: "機材・備品", icon: "🎤", color: "#7C5FC4", bg: "#F5F0FD", keywords: "機材,マイク,カメラ,照明,備品,電子機器,ケーブル" },
  { id: "other", label: "その他", icon: "📌", color: "#8B8080", bg: "#F5F2F2", keywords: "" },
];

const COLOR_PALETTE = [
  { color: "#E07B5A", bg: "#FDF3EF" },
  { color: "#5A8FE0", bg: "#EFF4FD" },
  { color: "#9ABF4A", bg: "#F4FDEE" },
  { color: "#E0C05A", bg: "#FDFAEF" },
  { color: "#C05AE0", bg: "#F7EFFD" },
  { color: "#5AE0C8", bg: "#EFFDF9" },
];

const SAMPLE_EXPENSES = [
  { id: 1, date: "2025-11-03", store: "コスチュームショップ ユニバース", amount: 12800, memo: "ユナイト公式衣装代", category: "costume", imageUrl: null },
  { id: 2, date: "2025-11-05", store: "スターバックス 渋谷店", amount: 1640, memo: "おぶやんさんとの打ち合わせ", category: "meeting", imageUrl: null },
  { id: 3, date: "2025-11-07", store: "エニタイムフィットネス", amount: 7700, memo: "ジム月会費", category: "health", imageUrl: null },
  { id: 4, date: "2025-11-10", store: "JR東日本", amount: 2340, memo: "ライブ会場への交通費", category: "transport", imageUrl: null },
  { id: 5, date: "2026-01-15", store: "コスチュームショップ ユニバース", amount: 18000, memo: "新衣装代", category: "costume", imageUrl: null },
  { id: 6, date: "2026-02-03", store: "エニタイムフィットネス", amount: 7700, memo: "ジム月会費", category: "health", imageUrl: null },
];

const SAMPLE_INCOME = [
  { id: 101, date: "2025-10-31", client: "株式会社ユナイト", amount: 150000, withholding: 15000, memo: "10月度出演料", invoiceNo: "INV-2025-010" },
  { id: 102, date: "2025-11-30", client: "○○プロダクション", amount: 80000, withholding: 8000, memo: "11月撮影出演費", invoiceNo: "INV-2025-011" },
  { id: 103, date: "2025-11-15", client: "株式会社ユナイト", amount: 50000, withholding: 5000, memo: "グッズ監修費", invoiceNo: "INV-2025-012" },
  { id: 104, date: "2026-01-31", client: "株式会社ユナイト", amount: 160000, withholding: 16000, memo: "1月度出演料", invoiceNo: "INV-2026-001" },
  { id: 105, date: "2026-02-15", client: "○○プロダクション", amount: 90000, withholding: 9000, memo: "2月撮影出演費", invoiceNo: "INV-2026-002" },
];

const fmt = (n) => `¥${Number(n).toLocaleString()}`;
const fmtDate = (s) => s?.replace(/-/g, "/") ?? "";
const getCat = (id, cats) => (cats || DEFAULT_CATEGORIES).find(c => c.id === id) ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
const getYear = (dateStr) => dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
const effectiveAmount = (exp) => Math.round((exp.amount * (exp.ratio ?? 100)) / 100);
const THIS_YEAR = new Date().getFullYear();

// ─────────────────────────────────────────────────────────
// 共通コンポーネント
// ─────────────────────────────────────────────────────────
function Badge({ categoryId, small, cats }) {
  const cat = getCat(categoryId, cats);
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
        onBlur={e => { e.target.style.borderColor = "#E8E2D8"; onBlur?.(); }} />
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
// カテゴリ管理モーダル
// ─────────────────────────────────────────────────────────
function CategoryModal({ categories, onAdd, onDelete, onClose, newCat, setNewCat }) {
  const ICONS = ["🏷️", "👗", "☕", "🌿", "🚃", "🎤", "📌", "🎵", "📸", "✈️", "🎭", "🎁", "🏠", "💄", "📚", "🎨", "💊", "🍱", "🎮", "💻"];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px",
        width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }}>
        {/* ハンドル */}
        <div style={{ width: 40, height: 4, background: "#E0DAD4", borderRadius: 999, margin: "0 auto 20px" }} />

        <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1714", marginBottom: 20 }}>🏷️ カテゴリ管理</div>

        {/* 既存カテゴリ一覧 */}
        <div style={{ marginBottom: 24 }}>
          {categories.filter(c => c.id !== "all").map(cat => (
            <div key={cat.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: cat.bg, borderRadius: 12, marginBottom: 8,
              border: `1.5px solid ${cat.color}33`,
            }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: cat.color }}>{cat.label}</div>
                {cat.keywords && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{cat.keywords}</div>}
              </div>
              {cat.id !== "other" && (
                <button onClick={() => onDelete(cat.id)} style={{
                  background: "none", border: "1px solid #e0d8d0", color: "#ccc",
                  width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* 新規追加フォーム */}
        <div style={{ background: "#FDFBF8", borderRadius: 16, padding: "18px 16px", border: "1.5px dashed #D4C9B8" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#5B4A3A", marginBottom: 14 }}>＋ 新しいカテゴリを追加</div>

          {/* アイコン選択 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>アイコン</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setNewCat(p => ({ ...p, icon }))} style={{
                  width: 38, height: 38, borderRadius: 10, border: newCat.icon === icon ? "2px solid #5B4A3A" : "1.5px solid #E0DAD4",
                  background: newCat.icon === icon ? "#F0EBE0" : "#fff", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* カテゴリ名 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>カテゴリ名</label>
            <input
              type="text" placeholder="例：ヘアメイク" value={newCat.label}
              onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))}
              style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#fff", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"}
            />
          </div>

          {/* キーワード */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>
              キーワード <span style={{ fontWeight: 400, color: "#bbb" }}>（スキャン自動判定に使用・カンマ区切り）</span>
            </label>
            <input
              type="text" placeholder="例：ヘアサロン,美容院,メイクアップ,ネイル"
              value={newCat.keywords}
              onChange={e => setNewCat(p => ({ ...p, keywords: e.target.value }))}
              style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#fff", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"}
            />
          </div>

          <button onClick={onAdd} disabled={!newCat.label.trim()} style={{
            width: "100%", border: "none", padding: "13px", borderRadius: 12,
            fontWeight: 800, fontSize: 15, cursor: newCat.label.trim() ? "pointer" : "not-allowed",
            background: newCat.label.trim() ? "linear-gradient(135deg, #5B4A3A, #7C6652)" : "#E8E2D8",
            color: newCat.label.trim() ? "#fff" : "#bbb",
            boxShadow: newCat.label.trim() ? "0 4px 14px rgba(91,74,58,0.3)" : "none",
            transition: "all 0.2s",
          }}>追加する</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 設定モーダル
// ─────────────────────────────────────────────────────────
function SettingsModal({ apiKey, setApiKey, onClose }) {
  const [inputKey, setInputKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(inputKey);
    localStorage.setItem("keihi-api-key", inputKey);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, padding: "24px",
        width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        animation: "fadeUp 0.3s ease"
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1714", marginBottom: 16 }}>⚙️ アプリ設定</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#5B4A3A", display: "block", marginBottom: 8, fontWeight: 700 }}>
            Anthropic API キー
          </label>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            style={{
              width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10,
              padding: "12px 14px", fontSize: 14, color: "#1A1714", background: "#FDFBF8",
              outline: "none", boxSizing: "border-box"
            }}
            onFocus={e => e.target.style.borderColor = "#A08F7A"}
            onBlur={e => e.target.style.borderColor = "#E8E2D8"}
          />
          <div style={{ fontSize: 11, color: "#888", marginTop: 8, lineHeight: 1.5 }}>
            ※ レシートや請求書のAI読み取りに使用します。<br />
            ※ APIキーはお使いのブラウザ（ローカル）にのみ保存されます。
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "#F0EBE0", color: "#7A6A55", fontWeight: 700, fontSize: 14
          }}>キャンセル</button>
          <button onClick={handleSave} style={{
            padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "#5B4A3A", color: "#fff", fontWeight: 700, fontSize: 14,
            boxShadow: "0 2px 8px rgba(91,74,58,0.3)"
          }}>保存する</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 経費カード
// ─────────────────────────────────────────────────────────
function ExpenseCard({ exp, onDelete, onEdit, onImageClick, onRatioChange, cats }) {
  const cat = getCat(exp.category, cats);
  const [showRatio, setShowRatio] = useState(false);
  const ratio = exp.ratio ?? 100;
  const effective = effectiveAmount(exp);
  const isPartial = ratio < 100;
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "16px 18px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10,
      borderLeft: `4px solid ${cat.color}`, transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
    >
      {/* メイン行 */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
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
            <Badge categoryId={exp.category} small cats={cats} />
            {isPartial && (
              <span style={{ fontSize: 11, color: "#C07A3A", background: "#FDF6EE", padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>
                按分 {ratio}%
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{fmt(effective)}</div>
          {isPartial && <div style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>{fmt(exp.amount)}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <button onClick={() => setShowRatio(p => !p)} style={{
              background: showRatio ? "#FDF6EE" : "none", border: `1px solid ${showRatio ? "#C07A3A44" : "#e5e5e5"}`,
              color: showRatio ? "#C07A3A" : "#bbb", padding: "3px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600
            }}>按分</button>
            <button onClick={() => onEdit && onEdit(exp)} style={{ background: "none", border: "1px solid #e5e5e5", color: "#6B7280", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>編集</button>
            <button onClick={() => onDelete(exp.id)} style={{ background: "none", border: "1px solid #e5e5e5", color: "#bbb", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>削除</button>
          </div>
        </div>
      </div>

      {/* 按分スライダー */}
      {showRatio && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F5F0E8", animation: "fadeUp 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5B4A3A" }}>仕事利用割合</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#C07A3A" }}>{ratio}%
              <span style={{ fontSize: 12, color: "#888", fontWeight: 500, marginLeft: 6 }}>→ 経費 {fmt(effective)}</span>
            </span>
          </div>
          {/* スライダー */}
          <input type="range" min="10" max="100" step="10" value={ratio}
            onChange={e => onRatioChange(exp.id, parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#C07A3A", cursor: "pointer" }}
          />
          {/* プリセット */}
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {[100, 80, 70, 50, 30].map(v => (
              <button key={v} onClick={() => onRatioChange(exp.id, v)} style={{
                padding: "4px 12px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: ratio === v ? "#C07A3A" : "#F5F0E8",
                color: ratio === v ? "#fff" : "#888",
              }}>{v}%</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 8, lineHeight: 1.6 }}>
            例：スマホ代は仕事50%、家賃は仕事30%など、仕事に使った割合だけ経費にできます
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 収入カード
// ─────────────────────────────────────────────────────────
function IncomeCard({ inc, onDelete, onEdit }) {
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
          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <button onClick={() => onEdit && onEdit(inc)} style={{ background: "none", border: "1px solid #e5e5e5", color: "#6B7280", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>編集</button>
            <button onClick={() => onDelete(inc.id)} style={{ background: "none", border: "1px solid #e5e5e5", color: "#bbb", padding: "3px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>削除</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 収入タブ — PDF読み取り
// ─────────────────────────────────────────────────────────
function IncomeTab({ incomes, setIncomes, selectedYear, apiKey }) {
  const [reading, setReading] = useState(false);
  const [editInc, setEditInc] = useState(null);
  const [error, setError] = useState(null);
  const [pdfName, setPdfName] = useState(null);
  const [filterClient, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" | "upload"
  const fileRef = useRef();

  // クライアント一覧
  const yearIncomes = incomes.filter(i => getYear(i.date) === selectedYear);
  const clients = ["all", ...Array.from(new Set(yearIncomes.map(i => i.client)))];

  // 集計
  const filtered = filterClient === "all" ? yearIncomes : yearIncomes.filter(i => i.client === filterClient);
  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0);
  const totalWith = filtered.reduce((s, i) => s + (i.withholding || 0), 0);

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

      const keyToUse = apiKey || window.__ANTHROPIC_KEY__ || "";
      if (!keyToUse) throw new Error("APIキーが設定されていません。右上の「⚙️設定」から登録してください。");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "x-api-key": keyToUse,
        },
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
      setEditInc({ ...parsed, id: Date.now() });
    } catch (e) {
      setError("PDFの読み取りに失敗しました。別のファイルを試してください。");
    } finally {
      setReading(false);
    }
  }, []);

  const saveIncome = () => {
    if (!editInc) return;
    setIncomes(p => {
      const exists = p.some(i => i.id === editInc.id);
      if (exists) return p.map(i => i.id === editInc.id ? editInc : i);
      return [editInc, ...p];
    });
    setEditInc(null);
    setPdfName(null);
    setViewMode("list");
  };

  const editIncome = (inc) => {
    setEditInc(inc);
    setViewMode("upload");
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
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => {
          if (viewMode === "list" || editInc) {
            setEditInc(null);
            setPdfName(null);
            setViewMode("upload");
          } else {
            setViewMode("list");
          }
        }} style={{
          flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
          background: viewMode === "upload" && !editInc ? "#4A9B72" : "#E8F5EE",
          color: viewMode === "upload" && !editInc ? "#fff" : "#4A9B72",
          fontWeight: 700, fontSize: 14, transition: "all 0.2s"
        }}>
          {viewMode === "upload" && !editInc ? "✕ 閉じる" : "＋ 請求書読取"}
        </button>
        <button onClick={() => {
          if (viewMode === "list" || !editInc || pdfName) {
            const today = new Date();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            setEditInc({ id: Date.now(), date: `${selectedYear}-${mm}-${dd}`, client: "", amount: "", withholding: "", memo: "", invoiceNo: "" });
            setPdfName(null);
            setViewMode("upload");
          } else {
            setViewMode("list");
          }
        }} style={{
          flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
          background: viewMode === "upload" && editInc && !pdfName ? "#4A9B72" : "#E8F5EE",
          color: viewMode === "upload" && editInc && !pdfName ? "#fff" : "#4A9B72",
          fontWeight: 700, fontSize: 14, transition: "all 0.2s"
        }}>
          {viewMode === "upload" && editInc && !pdfName ? "✕ 閉じる" : "✏️ 手入力"}
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
          {(!editInc || pdfName) && (
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
          )}

          {/* 編集フォーム */}
          {editInc && (
            <SectionCard style={{ marginTop: 12, animation: "fadeUp 0.25s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 20 }}>{pdfName ? "✅" : "✏️"}</span>
                <span style={{ fontWeight: 700, color: "#4A9B72", fontSize: 15 }}>
                  {pdfName ? "読み取り完了！内容を確認してください" : "手入力内容を設定してください"}
                </span>
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
// 月次グラフ
// ─────────────────────────────────────────────────────────
function MonthlyChart({ yearExpenses, yearIncomes, selectedYear }) {
  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const [mode, setMode] = useState("expense"); // "expense" | "income" | "both"

  const monthlyData = MONTHS.map((label, i) => {
    const m = String(i + 1).padStart(2, "0");
    const prefix = `${selectedYear}-${m}`;
    const exp = yearExpenses.filter(e => e.date?.startsWith(prefix)).reduce((s, e) => s + effectiveAmount(e), 0);
    const inc = yearIncomes.filter(e => e.date?.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
    return { label, exp, inc };
  });

  const maxVal = Math.max(...monthlyData.map(d => mode === "income" ? d.inc : mode === "expense" ? d.exp : Math.max(d.exp, d.inc)), 1);
  const BAR_H = 120;
  const BAR_W = 28;
  const GAP = 8;
  const TOTAL_W = monthlyData.length * (BAR_W + GAP);

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "20px 16px 16px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A" }}>📅 月次推移</div>
        <div style={{ display: "flex", background: "#F5F0E8", borderRadius: 10, padding: 3, gap: 2 }}>
          {[["expense", "経費"], ["income", "収入"], ["both", "両方"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} style={{
              padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, transition: "all 0.15s",
              background: mode === v ? "#fff" : "transparent",
              color: mode === v ? "#5B4A3A" : "#aaa",
              boxShadow: mode === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* SVGグラフ */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <svg width={Math.max(TOTAL_W + 20, 300)} height={BAR_H + 52} style={{ display: "block" }}>
          {/* グリッド線 */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <line key={r}
              x1={0} y1={BAR_H * (1 - r)} x2={TOTAL_W + 20} y2={BAR_H * (1 - r)}
              stroke="#F0EBE4" strokeWidth="1" strokeDasharray="3,3"
            />
          ))}

          {monthlyData.map((d, i) => {
            const x = i * (BAR_W + GAP);
            const expH = (d.exp / maxVal) * BAR_H;
            const incH = (d.inc / maxVal) * BAR_H;
            const hasData = d.exp > 0 || d.inc > 0;
            return (
              <g key={i}>
                {/* 収入バー */}
                {(mode === "income" || mode === "both") && d.inc > 0 && (
                  <rect
                    x={x + (mode === "both" ? 0 : 0)} y={BAR_H - incH}
                    width={mode === "both" ? BAR_W / 2 - 1 : BAR_W} height={incH}
                    fill="#4A9B72" rx="4" opacity="0.85"
                  />
                )}
                {/* 経費バー */}
                {(mode === "expense" || mode === "both") && d.exp > 0 && (
                  <rect
                    x={x + (mode === "both" ? BAR_W / 2 + 1 : 0)} y={BAR_H - expH}
                    width={mode === "both" ? BAR_W / 2 - 1 : BAR_W} height={expH}
                    fill="#C07A3A" rx="4" opacity="0.85"
                  />
                )}
                {/* データなし */}
                {!hasData && (
                  <rect x={x} y={BAR_H - 3} width={BAR_W} height={3} fill="#F0EBE4" rx="2" />
                )}
                {/* 月ラベル */}
                <text x={x + BAR_W / 2} y={BAR_H + 16} textAnchor="middle"
                  fontSize="10" fill="#aaa" fontFamily="'Hiragino Sans', sans-serif"
                >{d.label}</text>
                {/* 金額ラベル（データあるときのみ） */}
                {hasData && mode !== "both" && (
                  <text
                    x={x + BAR_W / 2}
                    y={BAR_H - (mode === "income" ? incH : expH) - 4}
                    textAnchor="middle" fontSize="8" fill="#888"
                    fontFamily="'Hiragino Sans', sans-serif"
                  >{Math.round((mode === "income" ? d.inc : d.exp) / 1000)}k</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 凡例 */}
      <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
        {(mode === "income" || mode === "both") && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#888" }}>
            <div style={{ width: 12, height: 12, background: "#4A9B72", borderRadius: 3 }} />収入
          </div>
        )}
        {(mode === "expense" || mode === "both") && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#888" }}>
            <div style={{ width: 12, height: 12, background: "#C07A3A", borderRadius: 3 }} />経費
          </div>
        )}
      </div>

      {/* 月別サマリー（データある月のみ） */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        {monthlyData.filter(d => d.exp > 0 || d.inc > 0).map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F5F0E8" }}>
            <span style={{ color: "#666", fontWeight: 600 }}>{d.label}</span>
            <div style={{ display: "flex", gap: 16 }}>
              {d.inc > 0 && <span style={{ color: "#4A9B72", fontWeight: 600 }}>収 {fmt(d.inc)}</span>}
              {d.exp > 0 && <span style={{ color: "#C07A3A", fontWeight: 600 }}>費 {fmt(d.exp)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// メインアプリ
// ─────────────────────────────────────────────────────────
export default function App() {
  const [expenses, setExpenses] = useState(SAMPLE_EXPENSES);
  const [incomes, setIncomes] = useState(SAMPLE_INCOME);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedYear, setSelectedYear] = useState(THIS_YEAR);
  const [mainTab, setMainTab] = useState("expense");
  const [expTab, setExpTab] = useState("list");
  const [filterCat, setFilterCat] = useState("all");
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [error, setError] = useState(null);
  const [manualEntry, setManualEntry] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState({ label: "", icon: "🏷️", keywords: "" });
  const [rejectedEntry, setRejectedEntry] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saving" | "saved" | "error"
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const fileRef = useRef();
  const nextId = useRef(200);
  const catId = useRef(100);
  const saveTimer = useRef(null);

  // ── ストレージからの初期ロード ──
  useEffect(() => {
    const load = () => {
      try {
        const savedKey = localStorage.getItem("keihi-api-key");
        if (savedKey) setApiKey(savedKey);

        const result = localStorage.getItem("keihi-data");
        if (result) {
          const data = JSON.parse(result);
          if (data.expenses?.length) setExpenses(data.expenses);
          if (data.incomes?.length) setIncomes(data.incomes);
          if (data.categories?.length) setCategories(data.categories);
          if (data.nextId) nextId.current = data.nextId;
          if (data.catId) catId.current = data.catId;
        }
      } catch (e) {
        // ストレージエラー → サンプルデータのまま使う
      } finally {
        setStorageReady(true);
      }
    };
    load();
  }, []);

  // ── データ変更時に自動保存（デバウンス800ms）──
  useEffect(() => {
    if (!storageReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(() => {
      try {
        const data = {
          expenses,
          incomes,
          categories,
          nextId: nextId.current,
          catId: catId.current,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("keihi-data", JSON.stringify(data));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (e) {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [expenses, incomes, categories, storageReady]);

  // カテゴリ追加
  const addCategory = () => {
    if (!newCat.label.trim()) return;
    const usedColors = categories.filter(c => c.id !== "all" && c.id !== "other").length;
    const palette = COLOR_PALETTE[usedColors % COLOR_PALETTE.length];
    const id = "cat_" + catId.current++;
    setCategories(prev => {
      const withoutOther = prev.filter(c => c.id !== "other");
      const other = prev.find(c => c.id === "other");
      return [...withoutOther, { id, ...newCat, ...palette }, other];
    });
    setNewCat({ label: "", icon: "🏷️", keywords: "" });
    setShowCatModal(false);
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setExpenses(prev => prev.map(e => e.category === id ? { ...e, category: "other" } : e));
  };

  // getCatをcategoriesに束縛したショートカット
  const gc = (id) => getCat(id, categories);

  const openManual = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setManualEntry({
      id: nextId.current++,
      date: `${selectedYear}-${mm}-${dd}`,
      store: "", memo: "", amount: "", category: "other", imageUrl: null,
    });
    setExpTab("manual");
  };

  const saveManual = () => {
    if (!manualEntry || !manualEntry.store || !manualEntry.amount) return;
    setExpenses(p => {
      const exists = p.some(e => e.id === manualEntry.id);
      const entry = { ...manualEntry, amount: parseInt(manualEntry.amount) || 0, ratio: manualEntry.ratio ?? 100 };
      if (exists) return p.map(e => e.id === manualEntry.id ? entry : e);
      return [entry, ...p];
    });
    setManualEntry(null);
    setExpTab("list");
  };

  const editExpense = (exp) => {
    setManualEntry(exp);
    setExpTab("manual");
  };

  // ── レシートスキャン処理 ──
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setRejectedEntry(null);
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

      // カテゴリ一覧をAIプロンプトに動的に組み込む
      const catList = categories
        .filter(c => c.id !== "all")
        .map(c => `${c.id}=${c.label}${c.keywords ? `(${c.keywords})` : ""}`)
        .join(", ");
      const catIds = categories.filter(c => c.id !== "all").map(c => c.id).join("|");

      const keyToUse = apiKey || window.__ANTHROPIC_KEY__ || "";
      if (!keyToUse) throw new Error("APIキーが設定されていません。右上の「⚙️設定」から登録してください。");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "x-api-key": keyToUse,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
              {
                type: "text", text: `あなたはフリーランスのアイドル・アーティスト（たきしま）の確定申告を補助するAIです。
このレシート・領収書を見て、**仕事上の必要経費として認められるか**を日本の税務基準で厳格に3段階判定してください。

対象者の仕事: アイドル活動・ライブ・撮影・グッズ監修・打ち合わせ・配信活動など

【OK: 必要経費として明確に認められるもの】
- 仕事用の衣装・コスチューム・ウィッグ（私服転用不可なもの）
- 仕事関係者との打ち合わせ飲食（相手の名前・目的が明確なもの）
- 仕事会場への交通費（電車・タクシー・新幹線など）
- 機材・備品（マイク・カメラ・照明・配信機材など業務専用）
- 業務専用スマホ・PC・ソフトウェア
- 撮影・収録スタジオ代
- ダンスレッスン・ボイストレーニング（直接業務に関係するもの）
- 仕事用のヘアメイク・スタイリスト費用（現場当日のもの）

【GRAY: グレーゾーン（税務調査で否認リスクあり・登録非推奨）】
- 一般的なジム・フィットネス月会費（個人の健康維持とみなされやすい）
- 美容院・ネイル・エステ（仕事との直接関係が証明しにくい）
- 普通の食事・カフェ（打ち合わせ目的か不明なもの）
- 一般的なサプリ・市販薬（業務上の必要性が薄い）
- ビジネス書・参考書（仕事との関連が曖昧）
- 私服としても着られる衣類・アクセサリー
- 自宅の家賃・光熱費（按分できるが証明が難しい）

【NG: 経費として認められないもの】
- プライベートの食事・飲み会（仕事関係者なし）
- 日用品・生活用品・食料品
- プライベートの旅行・観光・レジャー
- 趣味・娯楽（仕事と無関係のゲーム・映画など）
- 個人の医療費（業務上の怪我でない通常の通院）
- 家族・友人へのプレゼント

判定結果をJSONのみで返してください（前置き・説明・バッククォート不要）:
{
  "verdict": "ok" or "gray" or "ng",
  "reason": "判定理由を具体的に1〜2文で。grayの場合は否認されるリスクと理由を明記",
  "grayDetail": "grayの場合のみ：税務調査で指摘される可能性のある具体的なリスクポイント",
  "date": "YYYY-MM-DD",
  "store": "店名",
  "amount": 数値,
  "memo": "購入内容の簡潔な説明",
  "category": "${catIds}"
}

categoryの判断基準:
${catList}

verdict=ng/grayの場合もdate/store/amount/memoは必ず埋めてください。` }
            ]
          }]
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        if (resp.status === 401) throw new Error("APIキーが無効です(401)");
        throw new Error("APIエラー(" + resp.status + "): " + errText.slice(0, 80));
      }
      const data = await resp.json();
      if (data.error) throw new Error("APIエラー: " + data.error.message);
      const text = data.content?.map(i => i.text || "").join("") || "";
      if (!text) throw new Error("AIの応答が空でした");
      const clean = text.replace(/```json|```/g, "").trim();
      const jsonStart = clean.indexOf("{");
      const jsonEnd = clean.lastIndexOf("}");
      if (jsonStart === -1) throw new Error("レシートを読み取れませんでした");
      const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));

      if (parsed.verdict === "ng" || parsed.verdict === "gray") {
        setRejectedEntry({
          verdict: parsed.verdict,
          store: parsed.store,
          amount: parsed.amount,
          memo: parsed.memo,
          reason: parsed.reason,
          grayDetail: parsed.grayDetail || null,
          // keep full parsed so user can force-register
          full: parsed,
        });
        setPreviewUrl(null);
      } else {
        setEditEntry({ ...parsed, id: nextId.current++, imageUrl: url });
      }
    } catch (e) {
      setError(e.message || "読み取りに失敗しました。もう一度お試しください。");
    } finally {
      setScanning(false);
    }
  }, [categories]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const saveEntry = () => {
    if (!editEntry) return;
    setExpenses(p => [{ ...editEntry, ratio: editEntry.ratio ?? 100 }, ...p]);
    setEditEntry(null);
    setPreviewUrl(null);
    setExpTab("list");
  };

  const cancelScan = () => { setEditEntry(null); setPreviewUrl(null); setError(null); setRejectedEntry(null); };
  const deleteExpense = (id) => setExpenses(p => p.filter(e => e.id !== id));
  const updateRatio = (id, ratio) => setExpenses(p => p.map(e => e.id === id ? { ...e, ratio } : e));

  // 集計（選択年のみ）
  const yearExpenses = expenses.filter(e => getYear(e.date) === selectedYear);
  const yearIncomes = incomes.filter(i => getYear(i.date) === selectedYear);
  const grandExpense = yearExpenses.reduce((s, e) => s + effectiveAmount(e), 0);
  const grandIncome = yearIncomes.reduce((s, i) => s + i.amount, 0);
  const grandWith = yearIncomes.reduce((s, i) => s + (i.withholding || 0), 0);
  const filtered = filterCat === "all" ? yearExpenses : yearExpenses.filter(e => e.category === filterCat);
  const catTotals = categories.filter(c => c.id !== "all")
    .map(c => ({ ...c, total: yearExpenses.filter(e => e.category === c.id).reduce((s, e) => s + effectiveAmount(e), 0) }))
    .filter(c => c.total > 0);

  // 利用可能な年リスト（データから自動生成）
  const availableYears = Array.from(new Set([
    ...expenses.map(e => getYear(e.date)),
    ...incomes.map(i => getYear(i.date)),
    ...Array.from({ length: THIS_YEAR - 2024 }, (_, i) => 2025 + i),
  ])).filter(Boolean).sort((a, b) => b - a);

  const exportExpenseCSV = () => {
    const rows = ["発生日,勘定科目,税区分,金額,備考,取引先",
      ...yearExpenses.map(e => `${fmtDate(e.date)},${gc(e.category).label},課税仕入10%,${effectiveAmount(e)},${e.memo}（按分${e.ratio ?? 100}%）,${e.store}`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `経費データ_${selectedYear}年.csv`; a.click();
  };

  // ── メインタブ定義 ──
  const MAIN_TABS = [
    { id: "expense", label: "💳 経費" },
    { id: "income", label: "💴 収入" },
    { id: "summary", label: "📊 申告" },
  ];

  // ロード完了前はスケルトン表示
  if (!storageReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}>
        <div style={{ fontSize: 40 }}>💼</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#5B4A3A" }}>データを読み込んでいます…</div>
        <div style={{ width: 200, height: 6, background: "#E8E2D8", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "60%", background: "linear-gradient(90deg, #5B4A3A, #A08F7A)", borderRadius: 999, animation: "pulse 1.2s ease-in-out infinite" }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.5;transform:scaleX(0.8)} 50%{opacity:1;transform:scaleX(1.1)} }`}</style>
      </div>
    );
  }

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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1A1714", letterSpacing: -0.5 }}>💼 経費管理</h1>
                {saveStatus === "saving" && (
                  <span style={{ fontSize: 11, color: "#bbb", background: "#F5F2EE", padding: "2px 8px", borderRadius: 999 }}>保存中…</span>
                )}
                {saveStatus === "saved" && (
                  <span style={{ fontSize: 11, color: "#4A9B72", background: "#F0FAF4", padding: "2px 8px", borderRadius: 999 }}>✓ 保存済み</span>
                )}
                {saveStatus === "error" && (
                  <span style={{ fontSize: 11, color: "#C05050", background: "#FFF0F0", padding: "2px 8px", borderRadius: 999 }}>保存失敗</span>
                )}
              </div>
              <p style={{ margin: "1px 0 0", fontSize: 12, color: "#bbb" }}>たきしまさん専用</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setShowSettings(true)} style={{
                background: "#F0EBE0", border: "none", color: "#7A6A55",
                padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>⚙️ 設定</button>
              <button onClick={() => setShowCatModal(true)} style={{
                background: "#F0EBE0", border: "none", color: "#7A6A55",
                padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>🏷️ カテゴリ</button>
              {mainTab === "expense" && (
                <button onClick={exportExpenseCSV} style={{
                  background: "#F0EBE0", border: "none", color: "#7A6A55",
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600
                }}>📥 CSV</button>
              )}
            </div>
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

            {/* サブタブ（一覧 / 手入力 / スキャン） */}
            <div style={{ display: "flex", background: "#EEEAE2", borderRadius: 12, padding: 3, marginBottom: 18 }}>
              {[["list", "📋 一覧"], ["manual", "✏️ 手入力"], ["scan", "📷 スキャン"]].map(([t, label]) => (
                <button key={t} onClick={() => { setExpTab(t); if (t === "manual" && !manualEntry) openManual(); }} style={{
                  flex: 1, padding: "9px 4px", border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: 12, transition: "all 0.2s",
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
                  {categories.map(c => {
                    const active = filterCat === c.id;
                    return (
                      <button key={c.id} onClick={() => setFilterCat(c.id)} style={{
                        flexShrink: 0, padding: "6px 13px", borderRadius: 999, border: "none", cursor: "pointer",
                        fontWeight: 600, fontSize: 12, transition: "all 0.2s",
                        background: active ? gc(c.id).color : "#fff",
                        color: active ? "#fff" : "#888",
                        boxShadow: active ? `0 2px 8px ${gc(c.id).color}55` : "0 1px 4px rgba(0,0,0,0.06)",
                      }}>{c.icon} {c.label}</button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>
                  {filterCat !== "all" && `${gc(filterCat).label} · `}{filtered.length}件 · 合計 {fmt(filtered.reduce((s, e) => s + effectiveAmount(e), 0))}
                </div>
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>データがありません
                  </div>
                )}
                {filtered.map(exp => (
                  <ExpenseCard key={exp.id} exp={exp} onDelete={deleteExpense} onImageClick={setLightboxUrl} onRatioChange={updateRatio} cats={categories} />
                ))}
              </div>
            )}

            {/* 手入力フォーム */}
            {expTab === "manual" && (
              <div className="card-anim">
                <SectionCard>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 22 }}>✏️</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#1A1714" }}>経費を手入力</span>
                  </div>

                  {/* 日付 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>📅 日付</label>
                    <input type="date" value={manualEntry?.date ?? ""} onChange={e => setManualEntry(p => ({ ...p, date: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                  </div>

                  {/* 店名 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>🏪 店名・支払先</label>
                    <input type="text" placeholder="例：スターバックス 渋谷店" value={manualEntry?.store ?? ""} onChange={e => setManualEntry(p => ({ ...p, store: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                  </div>

                  {/* 内容 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>📝 内容・メモ</label>
                    <input type="text" placeholder="例：おぶやんさんとの打ち合わせ" value={manualEntry?.memo ?? ""} onChange={e => setManualEntry(p => ({ ...p, memo: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1714", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                  </div>

                  {/* 金額 */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 600 }}>💰 金額（円）</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 700, color: "#aaa" }}>¥</span>
                      <input type="number" placeholder="0" value={manualEntry?.amount ?? ""} onChange={e => setManualEntry(p => ({ ...p, amount: e.target.value }))}
                        style={{ width: "100%", border: "1.5px solid #E8E2D8", borderRadius: 10, padding: "10px 14px 10px 28px", fontSize: 18, fontWeight: 800, color: "#1A1714", background: "#FDFBF8", outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#A08F7A"} onBlur={e => e.target.style.borderColor = "#E8E2D8"} />
                    </div>
                  </div>

                  {/* カテゴリ */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 10, fontWeight: 600 }}>🏷️ カテゴリ</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {categories.filter(c => c.id !== "all").map(cat => {
                        const active = manualEntry?.category === cat.id;
                        return (
                          <button key={cat.id} onClick={() => setManualEntry(p => ({ ...p, category: cat.id }))} style={{
                            padding: "10px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                            border: active ? `2px solid ${cat.color}` : "2px solid #EEE",
                            background: active ? cat.bg : "#fff",
                            color: active ? cat.color : "#999",
                            fontWeight: active ? 700 : 500, fontSize: 12, transition: "all 0.15s",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                            <span style={{ fontSize: 20 }}>{cat.icon}</span>
                            <span style={{ lineHeight: 1.2 }}>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 保存ボタン */}
                  <button
                    onClick={saveManual}
                    disabled={!manualEntry?.store || !manualEntry?.amount}
                    style={{
                      width: "100%", border: "none", padding: "15px", borderRadius: 14,
                      fontWeight: 800, fontSize: 16, cursor: manualEntry?.store && manualEntry?.amount ? "pointer" : "not-allowed",
                      background: manualEntry?.store && manualEntry?.amount
                        ? "linear-gradient(135deg, #5B4A3A, #7C6652)"
                        : "#E8E2D8",
                      color: manualEntry?.store && manualEntry?.amount ? "#fff" : "#bbb",
                      boxShadow: manualEntry?.store && manualEntry?.amount ? "0 4px 16px rgba(91,74,58,0.3)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    保存する
                  </button>
                </SectionCard>
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

                {/* 経費NG / グレー表示 */}
                {rejectedEntry && !previewUrl && (() => {
                  const isGray = rejectedEntry.verdict === "gray";
                  const accent = isGray ? "#B07A20" : "#C05050";
                  const bgCard = isGray ? "#FFFBF0" : "#FFF5F5";
                  const bgBorder = isGray ? "#F5D87A" : "#FECACA";
                  const bgReason = isGray ? "#FEF3CC" : "#FFEAEA";
                  const emoji = isGray ? "⚠️" : "🚫";
                  const title = isGray ? "グレーゾーン：登録は非推奨です" : "経費として認められません";
                  const subtitle = isGray ? "税務調査で否認されるリスクがあります" : "日本の税務基準でNGと判定されました";
                  return (
                    <div style={{ animation: "fadeUp 0.3s ease" }}>
                      <div style={{
                        background: bgCard, border: `2px solid ${bgBorder}`, borderRadius: 20,
                        padding: "22px 20px", marginBottom: 12,
                      }}>
                        {/* ヘッダー */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                          <span style={{ fontSize: 30, lineHeight: 1 }}>{emoji}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: accent }}>{title}</div>
                            <div style={{ fontSize: 12, color: accent + "BB", marginTop: 3 }}>{subtitle}</div>
                          </div>
                        </div>

                        {/* 読み取り内容 */}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 4 }}>{rejectedEntry.store}</div>
                          <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{rejectedEntry.memo}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: accent }}>¥{Number(rejectedEntry.amount).toLocaleString()}</div>
                        </div>

                        {/* 判定理由 */}
                        <div style={{ background: bgReason, borderRadius: 10, padding: "12px 14px", marginBottom: isGray && rejectedEntry.grayDetail ? 10 : 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 4 }}>
                            {isGray ? "⚠️ グレーと判断した理由" : "❌ 判定理由"}
                          </div>
                          <div style={{ fontSize: 13, color: "#5A3A10", lineHeight: 1.7 }}>{rejectedEntry.reason}</div>
                        </div>

                        {/* グレーのみ：リスク詳細 */}
                        {isGray && rejectedEntry.grayDetail && (
                          <div style={{ background: "#FFF8E0", border: "1px solid #F5D87A", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#8A6010", marginBottom: 4 }}>📋 税務調査でのリスク</div>
                            <div style={{ fontSize: 13, color: "#5A3A10", lineHeight: 1.7 }}>{rejectedEntry.grayDetail}</div>
                          </div>
                        )}

                        {/* アクション */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => {
                            setExpenses(p => [{
                              id: nextId.current++,
                              date: rejectedEntry.full?.date || new Date().toISOString().slice(0, 10),
                              store: rejectedEntry.store,
                              amount: rejectedEntry.amount,
                              memo: rejectedEntry.memo,
                              category: rejectedEntry.full?.category || "other",
                              imageUrl: null,
                            }, ...p]);
                            setRejectedEntry(null);
                            setExpTab("list");
                          }} style={{
                            flex: 1, background: "#F0EBE0", border: "none", color: "#7A6A55",
                            padding: "11px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 12
                          }}>{isGray ? "リスク承知で登録する" : "それでも登録する"}</button>
                          <button onClick={() => setRejectedEntry(null)} style={{
                            flex: 1, background: accent, border: "none", color: "#fff",
                            padding: "11px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 12
                          }}>破棄する</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                        {categories.filter(c => c.id !== "all").map(cat => {
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

            {/* 月次グラフ */}
            <MonthlyChart yearExpenses={yearExpenses} yearIncomes={yearIncomes} selectedYear={selectedYear} />

            {/* 年間収支 */}
            <SectionCard style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5B4A3A", marginBottom: 14 }}>📊 {selectedYear}年 収支サマリー</div>
              {[
                { label: "売上合計（収入）", value: grandIncome, color: "#2D5A3D", big: true },
                { label: "経費合計", value: grandExpense, color: "#C07A3A" },
                { label: "課税対象（概算）", value: grandIncome - grandExpense, color: "#5B4A3A", big: true, border: true },
                { label: "源泉徴収された税額", value: grandWith, color: "#4A7BC4" },
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
              {categories.filter(c => c.id !== "all").map(cat => {
                const total = yearExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + effectiveAmount(e), 0);
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

            {/* データリセット */}
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <button onClick={() => {
                if (!window.confirm("すべてのデータを削除してサンプルデータに戻しますか？この操作は取り消せません。")) return;
                setExpenses(SAMPLE_EXPENSES);
                setIncomes(SAMPLE_INCOME);
                setCategories(DEFAULT_CATEGORIES);
                try { localStorage.removeItem("keihi-data"); } catch { }
              }} style={{
                background: "none", border: "none", color: "#ccc", fontSize: 12, cursor: "pointer", padding: "8px 16px"
              }}>🗑 データをリセットする</button>
            </div>
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {showCatModal && (
        <CategoryModal
          categories={categories}
          onAdd={addCategory}
          onDelete={deleteCategory}
          onClose={() => setShowCatModal(false)}
          newCat={newCat}
          setNewCat={setNewCat}
        />
      )}
      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
      <ImageModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
