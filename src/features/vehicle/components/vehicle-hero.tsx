import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function VehicleHero() {
  return (
    <section className="space-y-6" aria-labelledby="vehicle-hero-title">
      <Badge className="border border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/10">
        Authenticated vehicle dashboard
      </Badge>
      <div className="space-y-4">
        <h1
          id="vehicle-hero-title"
          className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-balance text-white sm:text-6xl lg:text-7xl"
        >
          A quiet control surface for your Model Y.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
          Mobile-first Tesla-style layout behind SSO. Status loads securely from the server;
          commands remain disabled for now.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled className="rounded-full bg-white px-6 text-black disabled:opacity-80">
          Session protected
        </Button>
        <Button
          disabled
          variant="outline"
          className="rounded-full border-white/15 bg-white/[0.04] px-6 text-white disabled:opacity-70"
        >
          Server-side status enabled
        </Button>
      </div>
    </section>
  );
}
