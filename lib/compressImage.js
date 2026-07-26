export function compressImage(file, maxWidth, quality) {
  maxWidth = maxWidth || 1280;
  quality = quality || 0.7;
  return new Promise(function (resolve, reject) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function (e) { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = function () {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(function (blob) {
        if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
        else reject(new Error("Compression failed"));
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}