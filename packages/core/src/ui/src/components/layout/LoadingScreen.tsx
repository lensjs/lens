import { LensLogo } from "../LensLogo";

const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-accent/20" />
          <LensLogo size={56} className="relative text-accent" />
        </span>
        <p className="text-sm font-medium text-muted">Loading Lens…</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
