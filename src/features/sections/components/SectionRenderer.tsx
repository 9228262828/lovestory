import { getSectionComponent } from '@/features/sections/registry/sectionRegistry'
import type { RomanticSection } from '@/types/section'

interface SectionRendererProps {
  sections: RomanticSection[]
}

export const SectionRenderer = ({ sections }: SectionRendererProps) => {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const SectionComponent = getSectionComponent(section.type)

        return <SectionComponent key={section.id} section={section} />
      })}
    </div>
  )
}
