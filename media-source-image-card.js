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
                display: flex;
                align-content: center;
                justify-content: center;
            }

            img {
                display: block;
                width: 100%;
            }

            img.off {
                -webkit-filter: grayscale();
            }

            .error {
              font-size: large;
              color: red;
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

  renderTemplate(template) {
    return new Promise(
      resolve => {
        this._hass.connection.subscribeMessage(
          output => {
            return resolve(output.result);
          },
          {
            type: 'render_template',
            template
          }
        );
      }
    );
  }

  renderJsTemplate(template) {
    let _template = template.replace('[[[', '').replace(']]]', '');
    return new Function('hass', 'states', 'user', 'config', `'use strict'; ${_template}`).call(this, this._hass, this._hass.states, this._hass.user, this.config);
  }

  getMediaUrl(url) {
    return new Promise(
      resolve => {
        if (url.indexOf('media-source://') == -1) return resolve({url});
        return resolve(this._hass.callWS({
          type: "media_source/resolve_media",
          media_content_id: url
        }));
      }
    );
  }

  async getImageUrl(image) {
    // if template, resolve rendered template:
    if (this.config.image.indexOf('{{') > -1) return this.getMediaUrl(await this.renderTemplate(image));
    if (this.config.image.indexOf('[[[') > -1) return this.getMediaUrl(await this.renderJsTemplate(image));
    // else, call HA service to get media source url:
    return this.getMediaUrl(image);
  }

  setConfig(config) {
    if (!config.image) {
      throw new Error('You have to provide an url for a media source image');
    }
    this.config = config;
  }

  watchEntities(input, hass) {
    if (!this.entitiesToWatch) this.entitiesToWatch = {};
    let entities = [...input.matchAll(/[0-9a-zA-z]*\.[0-9a-zA-z]*/g)];
    let hasChanged = false;
    for (const entity of entities.map(e => e[0])) {
      //const _entity = entity[0];
      if (hass.entities[entity]) {
        if (!this.entitiesToWatch[entity]) {
          // new entity found:
          hasChanged = true;
          this.entitiesToWatch[entity] = hass.states[entity].state;
        } else {
          if (this.entitiesToWatch[entity] !== hass.states[entity].state) {
            // existing entity state changed:
            hasChanged = true;
            this.entitiesToWatch[entity] = hass.states[entity].state;
            return true;
          }
        }
      }
    }
    // returns true if there's any new entity or state change:
    return hasChanged;
  }

  renderContent() {
    this.getImageUrl(this.config.image)
      .then(response => {
          if (this.image != response.url) {
            this.image = response.url;
            if (response.url.indexOf('mp4') != -1 || response.url.indexOf('ogg') != -1 || response.url.indexOf('webm') != -1) {
              this.content.innerHTML = `<video width="${this.config.video_options?.width || '320'}" height="${this.config.video_options?.height || '240'}" ${this.config.video_options?.show_controls ? 'controls' : ''} ${this.config.video_options?.loop ? 'loop' : ''} ${this.config.video_options?.autoplay ? 'autoplay' : ''} ${this.config.video_options?.muted ? 'muted' : ''} ${this.config.video_options?.type ? `type=${this.config.video_options?.type}`: ''}><source src="${response.url}" playsInLine></source></video>`;
            } else {
              this.content.innerHTML = `<img src=${response.url} class="${(this.config.entity_id && this.config.apply_grayscale) ? this._hass.states[this.config.entity_id].state : ''}">`;
            }
          }
      })
  }

  set hass(hass) {
    this._hass = hass;
    // render base html and initial content:
    if (!this.content) {
      this.renderBase();
      this.renderContent();
    }
    // when a related entity changes, refresh content:
    if (this.watchEntities(this.config.image, hass)) this.renderContent();
    // if forced_refresh_interval is set, register timeout to re-render content:
    if (this.config.forced_refresh_interval && !this.forced_refresh_interval) {
      this.forced_refresh_interval = setInterval(() => {console.log('timeout!!!!!!'); this.renderContent() }, this.config.forced_refresh_interval * 1000);
    }
    // apply grayscale according to entity state:
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
        this.content.querySelector("img")?.setAttribute("class", "off");
      } else {
        this.content.querySelector("img")?.removeAttribute("class", "off");
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
  `%c  MEDIA SOURCE IMAGE CARD %c Version 0.3.0 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
