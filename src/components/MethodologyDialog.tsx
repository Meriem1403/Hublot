import { useState } from 'react';
import { X } from 'lucide-react';

type MethodologySection = {
  title: string;
  bullets: string[];
};

type MethodologyDialogProps = {
  title: string;
  intro?: string;
  sections: MethodologySection[];
};

export function MethodologyDialog({ title, intro, sections }: MethodologyDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
      >
        Méthodologie des calculs
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Fermer la fiche méthodologie"
          />
          <div className="relative w-[min(920px,calc(100vw-2rem))] max-h-[min(80vh,720px)] overflow-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl text-gray-900">{title}</h3>
                {intro && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{intro}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-gray-900 font-semibold mb-2">{section.title}</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {section.bullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

