import P001 from "@/assets/P001.png";
import P002 from "@/assets/P002.png";
import P003 from "@/assets/P003.png";
import P004 from "@/assets/P004.png";
import P005 from "@/assets/P005.png";
import P006 from "@/assets/P006.png";
import P007 from "@/assets/P007.png";
import P008 from "@/assets/P008.png";
import P009 from "@/assets/P009.png";
import { resolvePrincipleContent } from "../../../locales";

type PrincipleId =
    | "P001"
    | "P002"
    | "P003"
    | "P004"
    | "P005"
    | "P006"
    | "P007"
    | "P008"
    | "P009";

export interface PrincipleInterpretation {
  context: string;
  irrelevant: boolean;
}

export type DeckInterpretations = Record<string, PrincipleInterpretation>;

export interface Principle {
  id: string;
  name: string;
  keywords: string;
  practice: string;
  image?: string;
}

interface DbPrinciple {
  principleId: string;
}

const PRINCIPLE_ASSETS: Record<PrincipleId, { image: string }> = {
  P001: { image: P001 },
  P002: { image: P002 },
  P003: { image: P003 },
  P004: { image: P004 },
  P005: { image: P005 },
  P006: { image: P006 },
  P007: { image: P007 },
  P008: { image: P008 },
  P009: { image: P009 },
};

/** Card artwork for a principle, by full id (`P005_autonomy`) or short id (`P005`). */
export function principleImage(principleId: string): string | undefined {
    const shortId = principleId.split('_')[0] as PrincipleId;
    return PRINCIPLE_ASSETS[shortId]?.image;
}

export function mapDbPrinciple(p: DbPrinciple): Principle {
    const locale = (typeof navigator !== 'undefined' ? (navigator.language.split('-')[0] as any) : 'en') as any;
    const localized = resolvePrincipleContent(p.principleId, locale);
    return {
        id: p.principleId,
        name: localized.name || p.principleId,
        keywords: localized.keywords,
        practice: localized.practice || '',
        image: principleImage(p.principleId),
    };
}
