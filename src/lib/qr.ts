import QRCode from "qrcode";
import { publicOrigin, DEMO_SLUG } from "./config";

/** Guest URL for a given table on the deployed (or local) origin. */
export function tableUrl(table: number, slug: string = DEMO_SLUG): string {
  return `${publicOrigin()}/r/${slug}?t=${table}`;
}

/** PNG data URL for a table's QR code, encoding the deployable guest URL. */
export async function tableQrDataUrl(table: number, slug: string = DEMO_SLUG): Promise<string> {
  return QRCode.toDataURL(tableUrl(table, slug), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#142819", light: "#fbf9f4" },
  });
}
