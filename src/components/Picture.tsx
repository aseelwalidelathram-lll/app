import { useEffect, useRef, useState } from 'react';
import { deleteImage, imageUrl, putImage } from '../engine/images';

/**
 * Shows a picture from either source: one that ships with the app (`src`), or
 * one stored on this device (`imageId`). A shipped cover wins, because it is
 * the deliberate choice — an upload is what you reach for when there isn't one.
 *
 * Renders nothing while loading or if the image has gone missing, so a lost
 * picture degrades to the emoji underneath rather than a broken-image icon.
 */
export function Picture({
  imageId,
  src,
  alt = '',
  className,
  style,
}: {
  imageId?: string;
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setFailed(false);
    if (src || !imageId) {
      setUrl(null);
      return;
    }
    imageUrl(imageId).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [imageId, src]);

  const resolved = src ?? url;
  if (!resolved || failed) return null;

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Add or replace a picture. Handles the whole round trip — file in, downscale,
 * store, hand back an id — so callers only ever deal with the id.
 */
export function PictureInput({
  imageId,
  onChange,
  label = 'Add a photo',
  shape = 'wide',
}: {
  imageId?: string;
  onChange: (id: string | undefined) => void;
  label?: string;
  shape?: 'wide' | 'square';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const next = await putImage(file);
      if (imageId) await deleteImage(imageId);
      onChange(next);
    } catch {
      setError('That image could not be saved. A different one may work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div
        className={`pic-drop ${shape}`}
        onClick={() => !busy && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        {imageId ? (
          <Picture imageId={imageId} alt="" className="pic-fill" />
        ) : (
          <span className="tiny faint">{busy ? 'Saving…' : label}</span>
        )}
      </div>

      <div className="row-wrap">
        <button className="btn sm ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
          {imageId ? 'Change' : 'Choose'}
        </button>
        {imageId && (
          <button
            className="btn sm ghost"
            onClick={async () => {
              await deleteImage(imageId);
              onChange(undefined);
            }}
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void choose(file);
          e.target.value = '';
        }}
      />
      {error && <div className="tiny" style={{ color: '#ff9b9b' }}>{error}</div>}
    </div>
  );
}
