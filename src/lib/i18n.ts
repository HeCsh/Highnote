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
  // Menu Elo interlude (optional dish picker + comparison)
  dishesTitle: string;
  dishesHint: string;
  compareTitle: string;
  compareHint: string;
  compareTie: string;
  skip: string;
  continueLabel: string;
  optional: string;
  sec_Starters: string;
  sec_Mains: string;
  sec_Desserts: string;
  sec_Drinks: string;
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
    posted: "Review accepted — thank you!",
    postedSub: "Your feedback just reached the owner. We appreciate you.",
    reviewIn: "a review in under 30 seconds",
    dishesTitle: "What did you have tonight?",
    dishesHint: "Tap what you ordered — helps us learn the menu. Optional.",
    compareTitle: "Which stood out more?",
    compareHint: "Just pick a favorite — no wrong answer.",
    compareTie: "Couldn't choose — both great",
    skip: "Skip",
    continueLabel: "Continue",
    optional: "OPTIONAL",
    sec_Starters: "Starters",
    sec_Mains: "Mains",
    sec_Desserts: "Desserts",
    sec_Drinks: "Drinks",
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
    posted: "Reseña recibida — ¡gracias!",
    postedSub: "Tu opinión acaba de llegar al dueño. Te lo agradecemos.",
    reviewIn: "una reseña en menos de 30 segundos",
    dishesTitle: "¿Qué pediste esta noche?",
    dishesHint: "Marca lo que pediste — nos ayuda a conocer el menú. Opcional.",
    compareTitle: "¿Cuál te gustó más?",
    compareHint: "Elige tu favorito — no hay respuesta incorrecta.",
    compareTie: "No pude decidir — los dos geniales",
    skip: "Omitir",
    continueLabel: "Continuar",
    optional: "OPCIONAL",
    sec_Starters: "Entrantes",
    sec_Mains: "Platos fuertes",
    sec_Desserts: "Postres",
    sec_Drinks: "Bebidas",
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
    posted: "评价已收到 — 谢谢！",
    postedSub: "您的反馈已送达店主。感谢您的支持。",
    reviewIn: "30 秒内完成一条评价",
    dishesTitle: "今晚您点了什么？",
    dishesHint: "点选您点过的菜——帮助我们了解菜单。选填。",
    compareTitle: "哪道更出彩？",
    compareHint: "选一个更喜欢的就好——没有标准答案。",
    compareTie: "难以取舍——两个都很棒",
    skip: "跳过",
    continueLabel: "继续",
    optional: "选填",
    sec_Starters: "前菜",
    sec_Mains: "主菜",
    sec_Desserts: "甜点",
    sec_Drinks: "饮品",
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
