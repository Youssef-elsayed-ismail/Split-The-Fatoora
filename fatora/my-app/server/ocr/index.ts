import { claudeOcrProvider } from './claude.ts'
import { geminiOcrProvider } from './gemini.ts'
import { OcrError, type OcrProvider } from './provider.ts'

/**
 * Provider registry. To swap OCR service, add a module implementing `OcrProvider`
 * and register it here — nothing else in the codebase needs to change.
 */
const PROVIDERS: Record<string, OcrProvider> = {
  claude: claudeOcrProvider,
  gemini: geminiOcrProvider,
}

const DEFAULT_PROVIDER = 'gemini'

export function getOcrProvider(): OcrProvider {
  const requested = process.env.OCR_PROVIDER?.trim() || DEFAULT_PROVIDER
  const provider = PROVIDERS[requested]

  if (!provider) {
    throw new OcrError(
      'unknown_provider',
      `OCR_PROVIDER "${requested}" is not registered. Available: ${Object.keys(PROVIDERS).join(', ')}.`,
      500,
      false,
    )
  }

  return provider
}

export { OcrError } from './provider.ts'
export { isSupportedMediaType, SUPPORTED_MEDIA_TYPES } from './provider.ts'
export type { OcrImage, OcrProvider, RawReceipt, SupportedMediaType } from './provider.ts'
export { validateRawReceipt, type ValidatedReceipt } from './validate.ts'
