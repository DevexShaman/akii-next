// 'use client';

// import GuestRoute from '@/components/Auth/GuestRoute';
// import SignIn from '@/components/Auth/SignIn';

// export default function SignInPage() {
//   return (
//     <GuestRoute>
//       <SignIn />
//     </GuestRoute>
//   );
// }

// For sign-in page
'use client'

import AuthComponent from "@/components/Auth/AuthForm";

const SignInPage = () => {
  return <AuthComponent />;
};

export default SignInPage;

