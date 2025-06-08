export const getRedirectUrl = (path: string = '/dashboard') => {
  // Server-side fallback
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}${path}`
      : `http://localhost:3000${path}`;
  }
  
  // Client-side: detect environment
  const isVercelDeployment = window.location.hostname.includes('vercel.app') || 
                            window.location.hostname === 'travel-tagger.vercel.app';
  
  return isVercelDeployment 
    ? `https://travel-tagger.vercel.app${path}`
    : `http://localhost:3000${path}`;
}; 