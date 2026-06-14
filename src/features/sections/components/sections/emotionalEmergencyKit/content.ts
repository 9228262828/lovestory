import type { JsonValue, RomanticSection } from '@/types/section'

export interface EmotionalDose {
  id: string
  title: string
  emoji: string
  message: string
}

export interface EmotionalEmergencyKitContent {
  title: string
  subtitle: string
  doses: EmotionalDose[]
  showParticles: boolean
  enableGlow: boolean
}

export const defaultEmotionalEmergencyKitTitle = 'حقيبة الإسعافات العاطفية'
export const defaultEmotionalEmergencyKitSubtitle =
  'لو الدنيا ضايقتك في أي وقت... أنا سايبلك شوية جرعات حب هنا ❤️'

export const defaultEmotionalEmergencyKitDoses: EmotionalDose[] = [
  {
    id: 'sadness-dose',
    title: 'جرعة ضد الزعل',
    emoji: '💊',
    message:
      'لو أنتِ زعلانة دلوقتي... فأنا عايزك تعرفي إن مفيش حاجة في الدنيا تستاهل دموعك. وإن في حد بيحبك أكتر مما تتخيلي ومستعد يعمل أي حاجة عشان يشوفك مبسوطة. خدي نفس عميق... ولو الزعل لسه موجود... اتصلي بيا فورًا ❤️',
  },
  {
    id: 'missing-you-dose',
    title: 'جرعة اشتياق',
    emoji: '💕',
    message:
      'لو وحشتك دلوقتي... فأنا متأكد إنك وحشتيني أكتر. بصي على صورنا، اسمعي فويس من اللي سايبهم ليكي، وافتكري إن كل يوم بيعدي بيقربنا أكتر ❤️',
  },
  {
    id: 'calm-dose',
    title: 'جرعة هدوء',
    emoji: '🌸',
    message:
      'لو متعصبة... سيبي الموبايل دقيقة، خدي نفس عميق، واشربي حاجة بتحبيها. ولو لسه متعصبة... اتصلي بيا وأنا أتصرف 😄❤️',
  },
  {
    id: 'encouragement-dose',
    title: 'جرعة تشجيع',
    emoji: '✨',
    message:
      'أسماء... لو حاسة إنك مش قادرة، فافتكري كل مرة قلتي فيها مش هعرف وعرفتي. أنا مؤمن بيكي أكتر ما أنتِ مؤمنة بنفسك أحيانًا. وإنتِ قد أي حاجة ❤️',
  },
  {
    id: 'peaceful-sleep-dose',
    title: 'جرعة نوم هادئ',
    emoji: '🌙',
    message:
      'مش عارفة تنامي؟ اقفلي عينيكي وتخيلي كل الحاجات الحلوة اللي لسه هنعملها سوا. ولو النوم برضه مجاش... اتصلي بيا 😌❤️',
  },
  {
    id: 'smile-dose',
    title: 'جرعة ابتسامة',
    emoji: '😘',
    message:
      'خدي بوسة يا عسليتي 😘❤️ أيوة البوسة دي ليكي لوحدك. ولو لسه ما ابتسمتيش... يبقى الحل إنك تتصلي بيا فورًا 😄❤️',
  },
]

export const defaultEmotionalEmergencyKitContent: EmotionalEmergencyKitContent = {
  title: defaultEmotionalEmergencyKitTitle,
  subtitle: defaultEmotionalEmergencyKitSubtitle,
  doses: defaultEmotionalEmergencyKitDoses,
  showParticles: true,
  enableGlow: true,
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  const normalizedValue = getOptionalString(value)
  return normalizedValue.length > 0 ? normalizedValue : fallback
}

const getBoolean = (value: JsonValue | undefined, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const normalizeDose = (rawDose: JsonValue, index: number): EmotionalDose | null => {
  if (!isRecord(rawDose)) {
    return null
  }

  const title = getOptionalString(rawDose.title)
  const message = getOptionalString(rawDose.message)

  if (title.length === 0 && message.length === 0) {
    return null
  }

  return {
    id: getOptionalString(rawDose.id) || `emotional-dose-${index + 1}`,
    title: title || `جرعة حب ${index + 1}`,
    emoji: getString(rawDose.emoji, '💊'),
    message: message || 'جرعة حب صغيرة مخصوص ليكي ❤️',
  }
}

const normalizeDoses = (value: JsonValue | undefined): EmotionalDose[] => {
  if (!Array.isArray(value)) {
    return defaultEmotionalEmergencyKitDoses
  }

  const normalizedDoses = value
    .map((rawDose, index) => normalizeDose(rawDose, index))
    .filter((dose): dose is EmotionalDose => dose !== null)

  return normalizedDoses.length > 0 ? normalizedDoses : defaultEmotionalEmergencyKitDoses
}

export const resolveEmotionalEmergencyKitContentFromRawContent = (
  rawContent: JsonValue,
  sectionTitle?: string,
): EmotionalEmergencyKitContent => {
  if (!isRecord(rawContent)) {
    return {
      ...defaultEmotionalEmergencyKitContent,
      title: sectionTitle?.trim() || defaultEmotionalEmergencyKitContent.title,
    }
  }

  return {
    title: getString(rawContent.title, sectionTitle?.trim() || defaultEmotionalEmergencyKitContent.title),
    subtitle: getString(rawContent.subtitle, defaultEmotionalEmergencyKitContent.subtitle),
    doses: normalizeDoses(rawContent.doses),
    showParticles: getBoolean(rawContent.showParticles, defaultEmotionalEmergencyKitContent.showParticles),
    enableGlow: getBoolean(rawContent.enableGlow, defaultEmotionalEmergencyKitContent.enableGlow),
  }
}

export const resolveEmotionalEmergencyKitContent = (section: RomanticSection): EmotionalEmergencyKitContent => {
  return resolveEmotionalEmergencyKitContentFromRawContent(section.content, section.title)
}
