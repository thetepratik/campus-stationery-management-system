/**
 * Helper to trigger a client-side file download from a Blob / binary response.
 * @param {Blob|ArrayBuffer|Uint8Array} blobData - The binary data of the PDF
 * @param {string} filename - The filename to save as (e.g. "invoice-ORD1001.pdf")
 */
export function triggerBlobDownload(blobData, filename = 'invoice.pdf') {
  const blob = blobData instanceof Blob 
    ? blobData 
    : new Blob([blobData], { type: 'application/pdf' });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  // Revoke the object URL after a short timeout to ensure download started
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
