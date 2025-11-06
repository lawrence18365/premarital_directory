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
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: '#6b7280'
    }}>
      <div 
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid #e9ecef',
          borderTop: '2px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span style={{ fontSize: '14px' }}>Loading chart...</span>
    </div>
  </div>
)

// Lazy Line Chart Component
export const LazyLineChart = ({ data, dataKey, color = "#2563eb", ...props }) => (
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
export const LazyBarChart = ({ data, dataKey, color = "#2563eb", ...props }) => (
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