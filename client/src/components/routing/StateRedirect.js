import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirects from old /professionals/:state URL to new /states/:state URL
 */
export const StateRedirect = () => {
  const { state } = useParams();
  return <Navigate to={`/states/${state}`} replace />;
};

/**
 * Redirects from old /professionals/:state/:cityOrSlug URL to new /states/:state/:cityOrSlug URL
 */
export const CityRedirect = () => {
  const { state, cityOrSlug } = useParams();
  return <Navigate to={`/states/${state}/${cityOrSlug}`} replace />;
};

/**
 * Redirects from old /professionals/:state/:city/:profileSlug URL to new /states/:state/:city/:profileSlug URL
 */
export const ProfileRedirect = () => {
  const { state, city, profileSlug } = useParams();
  return <Navigate to={`/states/${state}/${city}/${profileSlug}`} replace />;
};
