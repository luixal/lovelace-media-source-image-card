export class MediaSourceImageCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    if (!this._hass || !this.shadowRoot) {
      return;
    }

    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.data = this._config;
    form.schema = [
      {
        name: "image",
        required: true,
        selector: {
          media: {
            accept: ["image/jpeg", "image/png", "image/gif"]
          },
        },
      },
      {
        name: "entity_id",
        selector: {
          entity: {},
        },
      },
      {
        name: "refresh_entity",
        selector: {
          entity: {},
        },
      },
      {
        name: "apply_grayscale",
        selector: {
          boolean: {},
        },
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "aspect_ratio", selector: { text: {} } },
          {
            name: "object_fit",
            selector: {
              select: {
                options: ["contain", "cover", "fill", "scale-down", "none"],
              },
            },
          },
        ],
      },
      { name: "object_position", selector: { text: {} } },
      { name: "tap_action", selector: { "ui-action": {} } },
      {
        name: "forced_refresh_interval",
        selector: { number: { min: 0, step: 1, mode: "box" } },
      },
    ];
    form.computeLabel = this._computeLabel;
    form.computeHelper = this._computeHelper;

    form.addEventListener("value-changed", (ev) => {
      const config = ev.detail.value;
      const event = new CustomEvent("config-changed", {
        detail: { config: config },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(form);
  }

  _computeLabel(schema) {
    const labels = {
      image: "Image",
      entity_id: "Entity",
      refresh_entity: "Refresh Entity",
      apply_grayscale: "Apply Grayscale on 'off' state",
      aspect_ratio: "Aspect Ratio",
      object_fit: "Object Fit",
      object_position: "Object Position",
      tap_action: "Tap Action",
      forced_refresh_interval: "Forced Refresh Interval",
    };
    return labels[schema.name] || schema.name;
  }

  _computeHelper(schema) {
    if (schema.name === "forced_refresh_interval") {
      return "In seconds. Useful for images that are dynamically generated.";
    }
    return undefined;
  }
}
