import React from 'react';

const LocalContent = ({ locationName }) => {
  return (
    <div className="local-content-section">
      <h2 className="section-title">More Information About Premarital Counseling in {locationName}</h2>
      <div className="section-content">
        <p>
          This is a placeholder for unique, location-specific content about premarital counseling in {locationName}. You can add information here about:
        </p>
        <ul>
          <li>Local marriage laws and licensing requirements.</li>
          <li>Popular wedding venues in the area.</li>
          <li>Unique challenges or opportunities for couples in {locationName}.</li>
          <li>Interviews with local marriage experts.</li>
        </ul>
        <p>
          Adding high-quality, unique content to this section will significantly improve your local SEO.
        </p>
      </div>
    </div>
  );
};

export default LocalContent;
