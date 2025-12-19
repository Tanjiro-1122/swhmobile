import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Index() {
  useEffect(() => {
    window.location.replace(createPageUrl('Home'));
  }, []);

  return null; // Render nothing while redirecting
}