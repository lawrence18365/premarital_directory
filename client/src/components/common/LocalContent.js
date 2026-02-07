import React from 'react';

/**
 * LocalContent component - displays AI-generated or custom location-specific content
 * Only renders if actual content is provided (no more placeholder text)
 */
const LocalContent = ({ locationName, content }) => {
  // Don't render anything if no real content is provided
  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <div className="local-content-section">
      <h2 className="section-title">More Information About Premarital Counseling in {locationName}</h2>
      <div className="section-content" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default LocalContent;
