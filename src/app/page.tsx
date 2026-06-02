import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { SignInScreen } from "@/features/auth/components/sign-in-screen";
import { PushNotificationsCard } from "@/features/push/components/push-notifications-card";
import { VehicleActionGrid } from "@/features/vehicle/components/vehicle-action-grid";
import { VehicleHero } from "@/features/vehicle/components/vehicle-hero";
import { VehicleStatusCard } from "@/features/vehicle/components/vehicle-status-card";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  return (
    <AppShell userEmail={session.user.email} userName={session.user.name}>
      <div className="grid flex-1 items-center gap-5 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <VehicleHero />
        <VehicleStatusCard />
      </div>
      <div className="mt-5 sm:mt-10">
        <VehicleActionGrid />
      </div>
      <PushNotificationsCard />
    </AppShell>
  );
}
