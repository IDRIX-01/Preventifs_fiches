"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePad({
  onConfirm,
  onCancel,
}: {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }, []);

  // Charge la signature enregistrée de l'utilisateur connecté (si elle existe)
  useEffect(() => {
    let annule = false;
    fetch("/api/me/signature")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!annule) setSavedSignature(data?.signature ?? null);
      })
      .catch(() => {
        if (!annule) setSavedSignature(null);
      });
    return () => {
      annule = true;
    };
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    // Le canvas fait 400x180 en interne mais peut être affiché plus petit :
    // on corrige l'échelle pour que le trait suive bien le doigt/la souris.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  // Dessine la signature enregistrée dans le cadre, centrée et à l'échelle
  function utiliserSignatureEnregistree() {
    if (!savedSignature) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.min(
        (canvas.width * 0.9) / img.width,
        (canvas.height * 0.9) / img.height,
        1
      );
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      setIsEmpty(false);
    };
    img.src = savedSignature;
  }

  function confirm() {
    if (isEmpty) return;
    onConfirm(canvasRef.current!.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md">
        <h3 className="font-bold text-center mb-2">Votre signature</h3>

        {savedSignature && (
          <button
            type="button"
            onClick={utiliserSignatureEnregistree}
            className="w-full mb-2 border border-blue-600 text-blue-700 text-sm py-1.5 rounded hover:bg-blue-50"
          >
            Utiliser ma signature enregistrée
          </button>
        )}

        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          className="border border-gray-300 rounded w-full touch-none bg-gray-50"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <div className="flex justify-between mt-3 gap-2">
          <button onClick={clear} className="text-sm text-gray-500 hover:underline">
            Effacer
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={confirm}
              disabled={isEmpty}
              className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
            >
              Valider mon étape et transmettre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}