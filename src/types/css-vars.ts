import type {CSSProperties} from "react";

export type CSSVars<K extends string> = CSSProperties & Partial<Record<K, string | number>>;