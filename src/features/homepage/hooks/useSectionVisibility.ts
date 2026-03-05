/**
 * USE SECTION VISIBILITY HOOK
 * 
 * Reports whether a section has visible items after category filtering.
 * Used by section components to tell SectionRenderer to hide the header + wrapper.
 */

import { useEffect } from 'react'
import { useHomepageDataSafe } from '../context/HomepageDataContext'

/**
 * Call this in each section component after filtering.
 * It reports to the context whether this section should be hidden.
 * 
 * @param sectionType - The componentType string from SectionConfig (e.g. 'places', 'trending')
 * @param filteredCount - Number of items after category filtering
 */
export function useSectionVisibility(sectionType: string, filteredCount: number) {
  const homepageData = useHomepageDataSafe()

  useEffect(() => {
    if (!homepageData?.setSectionHidden) return
    homepageData.setSectionHidden(sectionType, filteredCount === 0)
  }, [sectionType, filteredCount, homepageData?.setSectionHidden])
}
