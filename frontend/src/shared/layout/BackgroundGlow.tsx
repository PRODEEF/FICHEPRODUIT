export function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute -left-[5%] -top-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/10 blur-[150px]" />
      <div className="absolute -right-[10%] top-[40%] h-[500px] w-[500px] rounded-full bg-purple-300/10 blur-[150px]" />
    </div>
  );
}
