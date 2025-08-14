
import * as React from "react"

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useBreakpoints() {
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof BREAKPOINTS | 'xs'>('xs')
  const [isMobile, setIsMobile] = React.useState(true)
  const [isTablet, setIsTablet] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl')
        setIsMobile(false)
        setIsTablet(false)
        setIsDesktop(true)
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl')
        setIsMobile(false)
        setIsTablet(false)
        setIsDesktop(true)
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg')
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md')
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm')
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      } else {
        setBreakpoint('xs')
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      }
    }

    updateBreakpoint()
    
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => updateBreakpoint()
    
    mediaQuery.addEventListener('change', handleChange)
    window.addEventListener('resize', updateBreakpoint)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('resize', updateBreakpoint)
    }
  }, [])

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop
  }
}
