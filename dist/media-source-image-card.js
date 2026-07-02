import { MediaSourceImageCardEditor } from "./classes/media-source-image-card-editor.js";
import { MediaSourceImageCard } from "./classes/media-source-image-card.js";

customElements.define("media-source-image-card-editor", MediaSourceImageCardEditor);
customElements.define("media-source-image-card", MediaSourceImageCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "media-source-image-card",
  name: "Media Source Image Card",
  description: "A custom card that shows images stored in HA Media Source"
});

console.info(
  `%c  MEDIA SOURCE IMAGE CARD %c Version 0.6.1 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
