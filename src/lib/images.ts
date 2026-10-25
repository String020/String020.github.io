import { getImage } from "astro:assets";
import handwritingBackground from "../assets/handwriting-bg.jpg";

// The backdrop tiles at 640px wide, so a 1280px WebP keeps it sharp on 2x screens.
const backgroundImage = await getImage({ src: handwritingBackground, width: 1280, format: "webp", quality: 72 });

export const backgroundStyle = `--background-image: url("${backgroundImage.src}")`;
