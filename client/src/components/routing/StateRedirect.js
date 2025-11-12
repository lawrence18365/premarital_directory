import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirects from old URLs to new SEO-optimized /premarital-counseling/ structure
 */
export const StateRedirect = () => {
  const { state } = useParams();
  return <Navigate to={`/premarital-counseling/${state}`} replace />;
};

/**
 * Redirects from old URLs to new SEO-optimized /premarital-counseling/ structure
 */
export const CityRedirect = () => {
  const { state, cityOrSlug } = useParams();
  return <Navigate to={`/premarital-counseling/${state}/${cityOrSlug}`} replace />;
};

/**
 * Redirects from old URLs to new SEO-optimized /premarital-counseling/ structure
 */
export const ProfileRedirect = () => {
  const { state, city, profileSlug } = useParams();
  return <Navigate to={`/premarital-counseling/${state}/${city}/${profileSlug}`} replace />;
};
