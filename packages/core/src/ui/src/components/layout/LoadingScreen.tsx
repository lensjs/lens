const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="relative">
        <div className="w-28 h-28 border-t-4 border-b-4 border-neutral-200 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-semibold text-lg">
          Lens.js
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
