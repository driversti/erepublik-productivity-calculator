// Icon URL builders, ported from app.js factoryIconUrl / plantationIconUrl
// and the hired-module icon paths.
import { EREP_CDN, FRM_BUILDING_IDS, WRM_BUILDING_IDS } from '../../data/buildingIds';
import type { IndustryConfig } from '../../data/types';

export function factoryIconUrl(cfg: IndustryConfig, quality: number): string {
  if (cfg.type === 'fw') {
    return `${EREP_CDN}/icons/industry/${cfg.isFood ? 1 : 2}/q${quality}.png`;
  }
  return `${EREP_CDN}/icons/industry/${cfg.factoryIconIndustry}/q${quality}.png`;
}

export function rmIconUrl(cfg: IndustryConfig, quality: number): string {
  if (cfg.type === 'fw') {
    const ids = cfg.isFood ? FRM_BUILDING_IDS : WRM_BUILDING_IDS;
    return `${EREP_CDN}/buildings/${ids[quality]}.png`;
  }
  return `${EREP_CDN}/buildings/${cfg.rmBuildingIds![quality]}.png`;
}
