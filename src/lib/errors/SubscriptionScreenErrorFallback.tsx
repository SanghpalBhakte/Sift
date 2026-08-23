"use client";

type Props = {
  title?: string;
  message?: string;
};

export function SubscriptionScreenErrorFallback({
  title = "This screen hit a problem",
  message = "Sweep couldn’t render this subscription view. Try refreshing or reopening it.",
}: Props) {
  return (
    <div
      role="alert"
      style={{
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{ marginBottom: 12, opacity: 0.8 }}>{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{ cursor: "pointer" }}
      >
        Refresh screen
      </button>
    </div>
  );
}
