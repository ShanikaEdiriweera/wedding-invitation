export const FEATURE_FLAGS: Record<'gallery' | 'coupleNamePath', boolean> = {
  gallery: false,
  coupleNamePath: false,
}

export type FeatureName = keyof typeof FEATURE_FLAGS

export function isFeatureEnabled(feature: string): boolean {
  return feature in FEATURE_FLAGS && FEATURE_FLAGS[feature as FeatureName] === true
}
