import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCities } from '../../data/locationConfig';
import '../../assets/css/compact-search.css';

const CompactSearch = () => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const specialtyOptions = [
    'Communication Skills',
    'Conflict Resolution',
    'Financial Planning',
    'Intimacy & Sexuality',
    'Family Planning',
    'Religious Counseling',
    'Christian Counseling',
    'Gottman Method',
    'Prepare/Enrich',
    'Blended Families',
    'LGBTQ+ Affirming'
  ];

  const handleLocationChange = (value) => {
    setLocation(value);
    if (value.length >= 2) {
      const results = searchCities(value, 5);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (city) => {
    setLocation(`${city.name}, ${city.state}`);
    setSuggestions([]);
    navigate(city.url);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (location.length >= 2) {
      const results = searchCities(location, 1);
      if (results.length > 0) {
        navigate(results[0].url);
      }
    }
  };

  return (
    <div className="compact-search">
      <form onSubmit={handleSearch} className="compact-search-form">
        <div className="compact-search-field compact-search-location">
          <label htmlFor="location" className="sr-only">Location</label>
          <input
            type="text"
            id="location"
            placeholder="City or State..."
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="compact-search-input"
          />
          {suggestions.length > 0 && (
            <ul className="compact-search-suggestions">
              {suggestions.map((city, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(city)}
                  className="compact-search-suggestion"
                >
                  {city.name}, {city.state}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="compact-search-field compact-search-specialty">
          <label htmlFor="specialty" className="sr-only">Specialty</label>
          <select
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="compact-search-select"
          >
            <option value="">All Specialties</option>
            {specialtyOptions.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="compact-search-button">
          <i className="fa fa-search"></i>
          <span className="compact-search-button-text">Search</span>
        </button>
      </form>
    </div>
  );
};

export default CompactSearch;
