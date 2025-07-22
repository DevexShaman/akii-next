import GuestRoute from "@/components/Auth/GuestRoute";
import SignIn from "@/components/Auth/SignIn";

export default function ForgetPassword() {
  return (
    <GuestRoute>
      <SignIn />
    </GuestRoute>
  );
}
