import React, { Suspense } from 'react'

// Lazy load recharts components for better performance
const LineChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
)
const Line = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
)
const XAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
)
const YAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
)
const CartesianGrid = React.lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
)
const Tooltip = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
)
const ResponsiveContainer = React.lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
)
const BarChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
)
const Bar = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
)

// Chart loading fallback
const ChartLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    background: 'var(--ds-surface-muted, #f4f9f9)',
    borderRadius: '8px',
    border: '1px solid var(--ds-border, rgba(14, 94, 94, 0.16))'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: 'var(--ds-ink-muted, rgba(11, 62, 62, 0.72))'
    }}>
      <div 
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--ds-border, rgba(14, 94, 94, 0.16))',
          borderTop: '2px solid var(--ds-accent, #0e5e5e)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span style={{ fontSize: '14px' }}>Loading chart...</span>
    </div>
  </div>
)

// Lazy Line Chart Component
export const LazyLineChart = ({ data, dataKey, color = "var(--ds-accent, #0e5e5e)", ...props }) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </Suspense>
)

// Lazy Bar Chart Component
export const LazyBarChart = ({ data, dataKey, color = "var(--ds-accent, #0e5e5e)", ...props }) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  </Suspense>
)

// Multi-line Chart Component
export const LazyMultiLineChart = ({ data, lines = [], ...props }) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {lines.map((line, index) => (
          <Line 
            key={index}
            type="monotone" 
            dataKey={line.dataKey} 
            stroke={line.color} 
            strokeWidth={2} 
            name={line.name || line.dataKey}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </Suspense>
)

// Add CSS for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}
