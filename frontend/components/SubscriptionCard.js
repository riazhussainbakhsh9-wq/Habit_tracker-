export default function SubscriptionCard({ subscription, onStripeCheckout, onOpenManualUpload }) {
  const plan = subscription?.plan || "free";
  const status = subscription?.status || "active";

  return (
    <div className="surface p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-2">Subscription</h2>
      <p className="text-sm text-stone-700">Plan: <strong>{plan.toUpperCase()}</strong></p>
      <p className="text-sm text-stone-700 mb-4">Status: <strong>{status.toUpperCase()}</strong></p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary text-sm" onClick={onStripeCheckout}>Pay with Stripe (Test)</button>
        <button className="btn btn-ghost text-sm" onClick={onOpenManualUpload}>Upload Screenshot</button>
      </div>
    </div>
  );
}
