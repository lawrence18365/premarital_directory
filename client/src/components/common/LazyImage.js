import React, { useState, useRef, useEffect } from 'react'

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad()
  }

  const handleError = () => {
    setHasError(true)
    onError()
  }

  const defaultPlaceholder = (
    <div 
      className={`lazy-image-placeholder ${className}`}
      style={{
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px',
        minHeight: '200px'
      }}
    >
      {hasError ? 'Failed to load image' : 'Loading...'}
    </div>
  )

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {isInView && !hasError ? (
        <>
          {!isLoaded && (placeholder || defaultPlaceholder)}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              ...(isLoaded ? {} : { position: 'absolute', top: 0, left: 0 })
            }}
            {...props}
          />
        </>
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  )
}

// Higher-order component for lazy loading existing images
export const withLazyLoading = (ImageComponent) => {
  return React.forwardRef((props, ref) => {
    return <LazyImage {...props} ref={ref} />
  })
}

export default LazyImage