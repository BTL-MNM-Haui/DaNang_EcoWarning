export async function compressImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Chọn ảnh JPG, PNG hoặc WebP.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Ảnh gốc cần nhỏ hơn 20 MB.");
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 60000000) {
    bitmap.close();
    throw new Error("Ảnh có độ phân giải quá lớn.");
  }
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82),
  );
  if (!blob || blob.size > 5 * 1024 * 1024)
    throw new Error("Chưa nén được ảnh dưới 5 MB. Hãy chọn ảnh khác.");
  return new File([blob], "minh-chung.jpg", { type: "image/jpeg" });
}
