import { useEffect, useId, type ReactNode } from 'react'

interface ScrollableAdminModalProps {
  isOpen: boolean
  title: string
  description?: string
  closeLabel?: string
  isCloseDisabled?: boolean
  maxWidthClassName?: string
  onClose: () => void
  children: ReactNode
}

export const ScrollableAdminModal = ({
  isOpen,
  title,
  description,
  closeLabel = 'Close',
  isCloseDisabled = false,
  maxWidthClassName = 'max-w-6xl',
  onClose,
  children,
}: ScrollableAdminModalProps) => {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const previousHtmlOverflow = documentElement.style.overflow
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
      documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={`flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl ${maxWidthClassName} max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]`}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-zinc-100">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-zinc-400">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isCloseDisabled}
            >
              {closeLabel}
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
      </div>
    </div>
  )
}
