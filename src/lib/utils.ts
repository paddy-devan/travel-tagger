export const getRedirectUrl = (path: string = '/dashboard') => {
  if (typeof window === 'undefined') return `http://localhost:3000${path}`;
  
  const isVercelDeployment = window.location.hostname.includes('vercel.app');
  return isVercelDeployment 
    ? `https://travel-tagger.vercel.app${path}`
    : `http://localhost:3000${path}`;
}; 