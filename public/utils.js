export const createDamUrl = (thumbnail) => {
  if (!thumbnail?.id) return null;

  const fileExtension = thumbnail.mimeType === "image/png" ? "png" : "jpg";
  return `https://cms-prod.gyldendaldigital.no/dam/preview/${thumbnail.id}/previews/maxWidth_200_maxHeight_200.${fileExtension}/*/${thumbnail.id}.${fileExtension}`;
};

export const createContentUrl = (originalUrl) => {
  if (!originalUrl) return "";
  if (!originalUrl.includes("/preview-content/")) return originalUrl;

  const contentId = originalUrl.split("/preview-content/")[1];
  return "https://stage.skolestudio.no/view--" + contentId;
};

export const createRedapticUrl = (originalUrl) => {
  if (!originalUrl) return "";
  if (!originalUrl.includes("/preview-content/")) return originalUrl;

  const contentId = originalUrl.split("/preview-content/")[1];
  return "https://redaptic.gyldendaldigital.no/" + contentId;
};

export const createRetestUrl = (originalUrl) => {
  if (!originalUrl) return "";

  return "/test?url=" + encodeURIComponent(originalUrl);
};

export const createHeaderCountPreview = (hit) => {
  const headers = [];
  if (!!hit.heading["h3Count"]) headers.push("H1");
  if (!!hit.heading["h4Count"]) headers.push("H2");
  if (!!hit.heading["h5Count"]) headers.push("H3");
  if (!!hit.heading["h6Count"]) headers.push("H4");
  return headers.join(" ");
};

export const translateHeadingLevel = (headingTag) => "H" + (parseInt(headingTag.replace(/\D/g, "")) - 2);

export const isCorrectHeadingOrder = (hit) => {
  if (!hit.heading["h3Count"]) return false;
  if (!hit.heading["h4Count"] && (!!hit.heading["h5Count"] || !!hit.heading["h6Count"])) return false;
  if (!hit.heading["h5Count"] && !!hit.heading["h6Count"]) return false;
  return true;
};
