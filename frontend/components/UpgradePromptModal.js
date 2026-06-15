export default function UpgradePromptModal({ open, onClose, onUpgrade }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close upgrade prompt"
        onClick={onClose}
      />

      <div className="surface relative z-10 w-full max-w-lg p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Free plan limit reached</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Upgrade to keep growing</h3>
        <p className="mt-3 text-sm md:text-base text-stone-600 leading-relaxed">
          You have reached the habit limit on the free plan. Upgrade your subscription to add more habits
          and unlock full tracking power.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button type="button" className="btn btn-primary" onClick={onUpgrade}>
            View Plans
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
