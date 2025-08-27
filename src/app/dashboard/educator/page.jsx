'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function EducatorDash() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session?.user) {
      router.push('/'); // Redirect to home if not authenticated
      return;
    }
    
    if (session.user.role !== 'educator') {
      router.push('/'); // Redirect to home if not educator
      return;
    }
    
    // Redirect to the actual dashboard
    router.push('/dashboard/educator/dashboard');
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
