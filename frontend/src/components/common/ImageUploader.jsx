import { useRef } from "react";
import { FiUploadCloud, FiX } from "react-icons/fi";

/**
 * multiple=false -> single image mode (categories); returns/accepts a single File
 * multiple=true -> gallery mode (products); returns/accepts a File[] array
 */
const ImageUploader = ({
  multiple = false,
  files,
  onChange,
  existingUrls = [],
  onRemoveExisting,
}) => {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList);
    if (multiple) {
      onChange([...(files || []), ...arr].slice(0, 6));
    } else {
      onChange(arr[0] || null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeNewFile = (index) => {
    const next = [...files];
    next.splice(index, 1);
    onChange(next);
  };

  const previewFiles = multiple ? files || [] : files ? [files] : [];

  return (
    <div className="form-group">
      <label className="form-label">Images</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: "2px dashed var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          textAlign: "center",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          background: "var(--color-bg)",
        }}
      >
        <FiUploadCloud size={28} style={{ marginBottom: 8 }} />
        <p style={{ fontSize: "var(--font-size-sm)" }}>
          Click or drag {multiple ? "images" : "an image"} here
        </p>
        <p style={{ fontSize: "var(--font-size-xs)" }}>
          JPEG, PNG, WEBP — max 5MB each{multiple ? ", up to 6 images" : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {(existingUrls.length > 0 || previewFiles.length > 0) && (
        <div
          className="flex gap-2"
          style={{ flexWrap: "wrap", marginTop: "var(--space-3)" }}
        >
          {existingUrls.map((url, i) => (
            <div
              key={`existing-${i}`}
              style={{ position: "relative", width: 72, height: 72 }}
            >
              <img
                src={url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--color-danger)",
                    color: "#fff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          ))}
          {previewFiles.map((file, i) => (
            <div
              key={`new-${i}`}
              style={{ position: "relative", width: 72, height: 72 }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-bg)",
                  color: "var(--color-text-muted)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                }}
              >
                New image
              </div>
              <button
                type="button"
                onClick={() => (multiple ? removeNewFile(i) : onChange(null))}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--color-danger)",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
