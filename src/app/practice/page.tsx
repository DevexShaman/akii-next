'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Layout from '@/components/Layout/Layout';
import PracticePage from '@/components/Practice/PracticePage';



export default function PracticeWrapper() {
  return (
    <ProtectedRoute>
      <Layout>
        <PracticePage />
      </Layout>
    </ProtectedRoute>
  );
}
