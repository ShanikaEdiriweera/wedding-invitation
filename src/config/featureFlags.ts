export const FEATURE_FLAGS: Record<'gallery' | 'coupleNamePath' | 'reachOut' | 'whatsapp', boolean> = {
  gallery: false,
  coupleNamePath: false,
  reachOut: true,
  whatsapp: true,
}

export type FeatureName = keyof typeof FEATURE_FLAGS

export function isFeatureEnabled(feature: string): boolean {
  return feature in FEATURE_FLAGS && FEATURE_FLAGS[feature as FeatureName] === true
}
