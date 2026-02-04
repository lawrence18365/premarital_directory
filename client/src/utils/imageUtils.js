/**
 * Image compression and resizing utilities
 * Ensures photos are optimized before upload to Cloudflare R2
 */

/**
 * Compress and resize an image file
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width (default: 800)
 * @param {number} options.maxHeight - Maximum height (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
 * @param {number} options.maxSizeKB - Maximum file size in KB (default: 500)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    // Create image element to load the file
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Set canvas size and draw image
      canvas.width = width
      canvas.height = height

      // Use white background for transparent images
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob with quality setting
      const tryCompress = (currentQuality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const sizeKB = blob.size / 1024

            // If still too large and quality can be reduced, try again
            if (sizeKB > maxSizeKB && currentQuality > 0.5) {
              tryCompress(currentQuality - 0.1)
              return
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`)
            resolve(compressedFile)
          },
          'image/jpeg',
          currentQuality
        )
      }

      tryCompress(quality)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load image from file
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file before processing
 * @param {File} file - The image file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateImage = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSizeMB = 10 // Max 10MB input (will be compressed)

  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a JPG, PNG, or WebP image' }
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Image must be smaller than ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * Get image dimensions from a file
 * @param {File} file - The image file
 * @returns {Promise<{ width: number, height: number }>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const imageUtils = {
  compressImage,
  validateImage,
  getImageDimensions
}

export default imageUtils
