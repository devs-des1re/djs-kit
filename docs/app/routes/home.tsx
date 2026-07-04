import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Home() {
  const navigate = useNavigate();
  
  // Client-side redirect via React Router
  useEffect(() => {
    navigate('/docs', { replace: true });
  }, [navigate]);

  // Instant inline redirect script to avoid any text flashing on screen during SSG load
  return (
    <script dangerouslySetInnerHTML={{ __html: `window.location.replace('/docs');` }} />
  );
}
