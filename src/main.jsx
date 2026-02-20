<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>経費管理アプリ</title>
  <!-- React本体の読み込み -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- ブラウザ上でJSXを変換するBabel -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F1; }
  </style>
</head>
<body>
  <!-- アプリの描画先 -->
  <div id="root"></div>

  <!-- type="text/babel" を付けることでJSXがブラウザで動くようになります -->
  <script type="text/babel">
    // Reactのフックをグローバルの React オブジェクトから取得
    const { useState, useRef, useCallback, useEffect } = React;

    // ─────────────────────────────────────────────────────────
    // Supabase & Anthropic 設定
    // ─────────────────────────────────────────────────────────
    const SUPABASE_URL = "https://oultpirylilasscnzwdz.supabase.co";
    const SUPABASE_KEY = "sb_publishable_bUqlCpLuD0MU4QT9tH_P3w_c3NTUo7D";
    
    // ★HTMLファイル単体の動作になるため、直接キーを記述するか空文字にします
    const ANTHROPIC_KEY = ""; 

    const sb = async (path, method = "GET", body = null, extraHeaders = {}) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
          ...extraHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) { const e = await res.text(); throw new Error(`DB ${res.status}: ${e.slice(0,100)}`); }
      const t = await res.text();
      return t ? JSON.parse(t) : null;
    };

    const toExp = r => ({ id: r.id, date: r.date, store: r.store, amount: r.amount, memo: r.memo||"", category: r.category||"other", imageUrl: r.image_url||null, ratio: r.ratio??100 });
    const toInc = r => ({ id: r.id, date: r.date, client: r.client, amount: r.amount, withholding: r.withholding||0, memo: r.memo||"", invoiceNo: r.invoice_no||"" });
    const toCat = r => ({ id: r.id, label: r.label, icon: r.icon, color: r.color, bg: r.bg, keywords: r.keywords||"" });
    const frExp = e => ({ id: e.id, date: e.date, store: e.store, amount: e.amount, memo: e.memo||"", category: e.category, image_url: e.imageUrl||null, ratio: e.ratio??100 });
    const frInc = i => ({ id: i.id, date: i.date, client: i.client, amount: i.amount, withholding: i.withholding||0, memo: i.memo||"", invoice_no: i.invoiceNo||"" });
    const frCat = (c, i) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color, bg: c.bg, keywords: c.keywords||"", sort_order: i });

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
              position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius:
