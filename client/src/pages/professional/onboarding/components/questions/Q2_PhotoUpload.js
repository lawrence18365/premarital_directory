import React, { useRef } from 'react'
import QuestionContainer from '../QuestionContainer'
import { validateImage, compressImage } from '../../../../../utils/imageUtils'
import { profileOperations, supabase } from '../../../../../lib/supabaseClient'

const Q2_PhotoUpload = ({
  currentStep,
  profileId,
  photoFile,
  photoPreview,
  setPhotoFile,
  setPhotoPreview,
  updateField,
  saving,
  error,
  setError,
  goToNextQuestion,
  goToPreviousQuestion
}) => {
  const fileInputRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate image
    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setError('')

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)

    // Store file for upload
    setPhotoFile(file)
  }

  const handleContinue = async () => {
    // Validation
    if (!photoFile && !photoPreview) {
      setError('Please upload a professional headshot — couples are much more likely to reach out when they can see who they\'ll be working with')
      return
    }

    // Upload photo if new file selected
    if (photoFile && profileId) {
      try {
        // Compress image before upload
        const compressedFile = await compressImage(photoFile, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          maxSizeKB: 500
        })

        const { data: uploadData, error: uploadError } = await profileOperations.uploadPhoto(
          compressedFile,
          profileId
        )

        if (uploadError) throw uploadError

        if (uploadData?.publicUrl) {
          // Update profile with photo URL
          await supabase
            .from('profiles')
            .update({ photo_url: uploadData.publicUrl })
            .eq('id', profileId)

          updateField('photo_url', uploadData.publicUrl)
          setPhotoPreview(uploadData.publicUrl)
        }
      } catch (photoErr) {
        console.error('Photo upload failed:', photoErr)
        setError('Failed to upload photo. Please try again.')
        return
      }
    }

    // Save and navigate
    await goToNextQuestion(currentStep)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleChangePhoto = () => {
    fileInputRef.current?.click()
  }

  return (
    <QuestionContainer
      currentStep={currentStep}
      saving={saving}
      error={error}
      onBack={goToPreviousQuestion}
      onContinue={handleContinue}
    >
      <div className="form-group">
        <label className="form-label">
          Upload a professional headshot
          <span className="form-label-subtitle">
            A friendly, professional photo helps couples feel more comfortable reaching out
          </span>
        </label>

        <div
          className={`photo-upload-area ${photoPreview ? 'has-photo' : ''}`}
          onClick={!photoPreview ? handleUploadClick : undefined}
        >
          {photoPreview ? (
            <>
              <img src={photoPreview} alt="Profile preview" className="photo-preview" />
              <button
                type="button"
                className="btn-skip"
                onClick={handleChangePhoto}
                style={{ margin: '0 auto' }}
              >
                Change Photo
              </button>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <i className="fa fa-camera"></i>
              </div>
              <div className="upload-text">Click to upload a photo</div>
              <div className="upload-subtext">
                JPG, PNG or GIF (max 5MB)
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </QuestionContainer>
  )
}

export default Q2_PhotoUpload
