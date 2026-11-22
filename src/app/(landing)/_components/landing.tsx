import ForceLight from "./force-light";
import LandingClosing from "./landing-closing";
import LandingFeatures from "./landing-features";
import LandingFooter from "./landing-footer";
import LandingHeader from "./landing-header";
import LandingHero from "./landing-hero";
import LandingHow from "./landing-how";
import RevealObserver from "./reveal-observer";

export default function Landing() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ForceLight />
      <RevealObserver />
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingFeatures />
        <LandingHow />
        <LandingClosing />
      </main>
      <LandingFooter />
    </div>
  );
}
