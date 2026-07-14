import { useEffect, useState } from "react";

export type Lang = "en" | "es" | "zh";

export const LANGS: { key: Lang; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
  { key: "zh", label: "中文" },
];

export interface GuestStrings {
  thanks: string;
  table: string;
  question: string;
  stoodOut: string;
  tag_food: string;
  tag_service: string;
  tag_ambiance: string;
  tag_speed: string;
  tag_value: string;
  commentLabel: string;
  commentPlaceholder: string;
  google: string;
  compliance: string;
  posted: string;
  postedSub: string;
  reviewIn: string;
}

/** Guest-facing strings only. Natural phrasing, not word-for-word. */
export const GUEST_STRINGS: Record<Lang, GuestStrings> = {
  en: {
    thanks: "THANKS FOR DINING",
    table: "TABLE",
    question: "How was everything today?",
    stoodOut: "WHAT STOOD OUT?",
    tag_food: "Food",
    tag_service: "Service",
    tag_ambiance: "Ambiance",
    tag_speed: "Speed",
    tag_value: "Value",
    commentLabel: "ANYTHING FOR THE KITCHEN? (OPTIONAL)",
    commentPlaceholder: "Anything you'd like the kitchen to know?",
    google: "Post your review on Google",
    compliance: "Same button for every rating. No rewards for reviews.",
    posted: "Thanks — your review is ready for Google",
    postedSub: "Opening Google in a new tab. Your feedback also reached the owner.",
    reviewIn: "a review in under 30 seconds",
  },
  es: {
    thanks: "GRACIAS POR SU VISITA",
    table: "MESA",
    question: "¿Qué tal estuvo todo hoy?",
    stoodOut: "¿QUÉ DESTACÓ?",
    tag_food: "Comida",
    tag_service: "Servicio",
    tag_ambiance: "Ambiente",
    tag_speed: "Rapidez",
    tag_value: "Precio",
    commentLabel: "¿ALGO PARA LA COCINA? (OPCIONAL)",
    commentPlaceholder: "¿Algo que le gustaría que la cocina supiera?",
    google: "Publica tu reseña en Google",
    compliance: "El mismo botón para cada calificación. Sin recompensas por reseñas.",
    posted: "Gracias — tu reseña está lista para Google",
    postedSub: "Abriendo Google en una nueva pestaña. Tu opinión también llegó al dueño.",
    reviewIn: "una reseña en menos de 30 segundos",
  },
  zh: {
    thanks: "感谢您的光临",
    table: "餐桌",
    question: "今天的用餐体验如何？",
    stoodOut: "哪些方面让您印象深刻？",
    tag_food: "菜品",
    tag_service: "服务",
    tag_ambiance: "环境",
    tag_speed: "上菜速度",
    tag_value: "性价比",
    commentLabel: "有什么想告诉后厨的吗？（选填）",
    commentPlaceholder: "有什么想让后厨知道的吗？",
    google: "在谷歌上发表您的评价",
    compliance: "每个评分都用同一个按钮。评价不设任何奖励。",
    posted: "谢谢 — 您的评价已准备好发布到谷歌",
    postedSub: "正在新标签页中打开谷歌。您的反馈也已送达店主。",
    reviewIn: "30 秒内完成一条评价",
  },
};

const LS_KEY = "highnote:lang";

export function useLang(): [Lang, (l: Lang) => void, GuestStrings] {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY) as Lang | null;
      if (saved && saved in GUEST_STRINGS) return saved;
    } catch {
      /* ignore */
    }
    return "en";
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }, [lang]);

  return [lang, setLangState, GUEST_STRINGS[lang]];
}
