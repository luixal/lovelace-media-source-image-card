class MediaSourceImageCard extends HTMLElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    }
  }

  renderBase() {
    if (!this.content) {
      this.innerHTML = `
        <style>
            ha-card {
                overflow: hidden;
                height: 100%;
            }

            ha-card.clickable {
                cursor: pointer;
            }

            .card-content {
                padding: 0px;
            }

            img {
                display: block;
                width: 100%;
            }

            img.off {
                -webkit-filter: grayscale();
            }

        </style>
        <ha-card>
            <div class="card-content">
                <img src="">
            </div>
        </ha-card>
      `;
      this.content = this.querySelector("div");
      this.content.addEventListener('click', () => this.handleClick())
    }
  }

  setConfig(config) {
    if (!config.image) {
      throw new Error('You have to provide an url for a media source image');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    // render base html:
    if (!this.content) this.renderBase();
    // resolve image from media source and render it:
    if (!this.image || this.image != this.config.image) {
      this.image = this.config.image;
      hass.callWS({
        type: "media_source/resolve_media",
        media_content_id: this.config.image
      }).then(response => {
        this.content.innerHTML = `
                      <img src=${response.url} class="${(this.config.entity_id && this.config.apply_grayscale) ? hass.states[this.config.entity_id].state : ''}">
                  `;
      }
      );
    }
    // apply grayscale:
    if (this.config.entity_id) {
      const newState = hass.states[this.config.entity_id].state;
      if (this.entity_state != newState) {
        this.entity_state = newState;
        this.onEntityStateChange(newState);
      }
    }
  }

  onEntityStateChange(state) {
    if (this.config.apply_grayscale) {
      if (state == 'off') {
        this.content.querySelector("img").setAttribute("class", "off");
      } else {
        this.content.querySelector("img").removeAttribute("class", "off");
      }
    }
  }

  handleClick() {
    // actions: toggle, call-service, none, (unsupported -->) more-info, navigate, url
    // handle none case:
    if (this.config.tap_action == 'none') return;
    // default values for toggle case:
    let domain = 'homeassistant';
    let service = 'toggle';
    let target = { entity_id: this.config.entity_id };
    let data = {};
    // handle call-service case:
    if (this.config.tap_action?.action == 'call-service') {
      let _data = this.config.tap_action;
      domain = _data.service.split('.')[0];
      service = _data.service.split('.')[1];
      if (_data.target) target = _data.target;
      if (_data.data) data = _data.data;
    }
    // call service:
    this._hass.callService(domain, service, target, data);
  }

  getCardSize() {
    return 1;
  }
}

customElements.define("media-source-image-card", MediaSourceImageCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "media-source-image-card",
  name: "Media Source Image Card",
  description: "A custom card that shows images stored in HA Media Source"
});

console.info(
  `%c  MEDIA SOURCE IMAGE CARD %c Version 0.1.0 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
