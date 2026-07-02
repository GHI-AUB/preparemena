import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, BoxplotChart, LineChart, MapChart, ScatterChart } from 'echarts/charts'
import { GeoComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([BarChart, BoxplotChart, LineChart, MapChart, ScatterChart, GeoComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, SVGRenderer])

type ChartProps = {
  option: Record<string, unknown>
  height?: number
  ariaLabel: string
  onClick?: (params: unknown) => void
}

export function Chart({ option, height = 320, ariaLabel, onClick }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let chart: echarts.ECharts | null = null
    const mount = () => {
      if (chart || element.clientWidth === 0 || element.clientHeight === 0) return
      chart = echarts.init(element, undefined, { renderer: 'svg' })
      chart.setOption(option)
      if (onClick) chart.on('click', onClick)
    }
    const observer = new ResizeObserver(() => {
      mount()
      chart?.resize()
    })
    observer.observe(element)
    mount()
    return () => { observer.disconnect(); chart?.dispose() }
  }, [option, onClick])
  return <div ref={ref} role="img" aria-label={ariaLabel} style={{ height }} />
}
