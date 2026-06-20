import { Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";

export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "700"],
});
