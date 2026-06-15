import { useState } from "react";

export default function PaymentModal({ open, onClose, onUpload }) {
  const [file, setFile] = useState(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4">
      <div className="surface w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Upload Payment Screenshot</h3>
        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (file) onUpload(file);
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
