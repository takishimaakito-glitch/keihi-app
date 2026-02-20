import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────
// Supabase 設定
// ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://oultpirylilasscnzwdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_bUqlCpLuD0MU4QT9tH_P3w_c3NTUo7D";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// DB行 ↔ アプリ形式の変換
const toExpense = r => ({ id: r.id, date: r.date, store: r.store, amount: r.amount, memo: r.memo || "", category: r.category || "other", imageUrl: r.image_url || null, ratio: r.ratio ?? 100 });
const toIncome  = r => ({ id: r.id, date: r.date, client: r.client, amount: r.amount, withholding: r.withholding || 0, memo: r.memo || "", invoiceNo: r.invoice_no || "" });
const toCat     = r => ({ id: r.id, label: r.label, icon: r.icon, color: r.color, bg: r.bg, keywords: r.keywords || "" });
const fromExpense = e => ({ id: e.id, date: e.date, store: e.store, amount: e.amount, memo: e.memo || "", category: e.category, image_url: e.imageUrl || null, ratio: e.ratio ?? 100 });
const fromIncome  = i => ({ id: i.id, date: i.date, client: i.client, amount: i.amount, withholding: i.withholding || 0, memo: i.memo || "", invoice_no: i.invoiceNo || "" });
const fromCat     = (c, order) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color, bg: c.bg, keywords: c.keywords || "", sort_order: order });

// ─────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "all",       label: "すべて",            icon: "📊", color: "#6B7280", bg: "#F3F4F6", keywords: "" },
  { id: "costume",   label: "衣装・コスチューム", icon: "👗", color: "#DB6B8A", bg: "#FDF2F5", keywords: "衣装,コスチューム,服,アクセサリー,ウィッグ" },
  { id: "meeting",   label: "打ち合わせ",         icon: "☕", color: "#C07A3A", bg: "#FDF6EE", keywords: "カフェ,レストラン,飲食,コーヒー,食事,ランチ,ディナー" },
  { id: "health",    label: "健康管理",           icon: "🌿", color: "#4A9B72", bg: "#F0FAF4", keywords: "ジム,フィットネス,スポーツ,健康,プロテイン,サプリ" },
  { id: "transport", label: "交通費",             icon: "🚃", color: "#4A7BC4", bg: "#EFF5FD", keywords: "電車,バス,タクシー,交通,新幹線,飛行機,駐車場" },
  { id: "equipment", label: "機材・備品",         icon: "🎤", color: "#7C5FC4", bg: "#F5F0FD", keywords: "機材,マイク,カメラ,照明,備品,電子機器,ケーブル" },
  { id: "other",     label: "その他",             icon: "📌", color: "#8B8080", bg: "#F5F2F2", keywords: "" },
];

const COLOR_PALETTE = [
  { color: "#E07B5A", bg: "#FDF3EF" },
  { color: "#5A8FE0", bg: "#EFF4FD" },
  { color: "#9ABF4A", bg: "#F4FDEE" },
  { color: "#E0C05A", bg: "#FDFAEF" },
  { color: "#C05AE0", bg: "#F7EFFD" },
  { color: "#5AE0C8", bg: "#EFFDF9" },
];

const SAMPLE_EXPENSES = [];
const SAMPLE_INCOME = [];

const fmt    = (n) => `¥${Number(n).toLocaleString()}`;
const fmtDate = (s) => s?.replace(/-/g, "/") ?? "";
const getCat  = (id, cats) => (cats || DEFAULT_CATEGORIES).find(c => c.id === id) ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
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
  const base =
