import { OliveType } from './olive-type.enum';
import { OilType } from './oil-type.enum';

/** Olive -> Oil (OC→HC, OB→HB) */
export function mapOilFromOlive(olive?: OliveType | null): OilType | null {
  if (!olive) return null;
  switch (olive) {
    case OliveType.OC: return OilType.HC;
    case OliveType.OB: return OilType.HB;
    default: return null;
  }
}

/** Oil -> Olive (HB→OB, HC→OC) */
export function mapOliveFromOil(oil?: OilType | null): OliveType | null {
  if (!oil) return null;
  switch (oil) {
    case OilType.HB: return OliveType.OB;
    case OilType.HC: return OliveType.OC;
    default: return null;
  }
}
