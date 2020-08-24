export class Options {
  constructor() {
    this.defaultOptions = {
      icEnableComposeMessage: true,
      icEnableReplyMessage: true,
      icEnableForwardMessage: true
    };

    this.tb68MigratablePrefs = {
      "extensions.org.janek.IdentityChooser.extendButtonNewmsg": "icEnableComposeMessage",
      "extensions.org.janek.IdentityChooser.extendButtonForward": "icEnableForwardMessage",
      "extensions.org.janek.IdentityChooser.extendButtonReply": "icEnableReplyMessage"
    }
  }

  async run() {
    console.debug("Options#run -- begin");

    await this.localizePage();
    await this.updateUI();
    await this.setupListeners();

    console.debug("Options#run -- end");
  }

  async setupDefaultOptions() {
    console.debug("Option#setupDefaultOptions -- begin");

    var icOptions = await browser.storage.local.get();
    console.debug('Option#setupDefaultOptions: locally stored option:',  icOptions);

    if(Object.entries(icOptions).length == 0) {
      console.debug('Option#setupDefaultOptions: not stored options -> migrate TB68 prefs to local storage');
      icOptions = await this.migrateFromTB68Prefs();

      console.debug('Option#setupDefaultOptions: found TB68 prefs', icOptions);
    }

    for(const [optionName, defaultValue] of Object.entries(this.defaultOptions)) {
      if(!(optionName in icOptions)) {
        browser.storage.local.set({ [optionName] : defaultValue});
      }
    }

    console.debug("Option#setupDefaultOptions -- end");
  }

  async migrateFromTB68Prefs() {
    console.debug("Options#migrateFromTB68Prefs -- begin");

    var ret = {}
    for(const [legacyPrefName, optionName] of Object.entries(this.tb68MigratablePrefs)) {
      var legacyPrefValue =
          await browser.legacyPrefsApi.get(legacyPrefName,
                                           this.defaultOptions[optionName]);

      if(legacyPrefValue != null) {
        ret[optionName] = legacyPrefValue;
        browser.storage.local.set({ [optionName] : legacyPrefValue });
      }
    }

    console.debug("Options#migrateFromTB68Prefs -- end");
    return ret;
  }

  async isEnabledComposeMessage() {
    return this.isEnabledOption("icEnableComposeMessage", true);
  }

  async isEnabledReplyMessage() {
    return this.isEnabledOption("icEnableReplyMessage", true);
  }

  async isEnabledForwardMessage() {
    return this.isEnabledOption("icEnableForwardMessage", true);
  }

  async isEnabledOption(option, defaultValue) {
    var icOptions = await browser.storage.local.get();

    var ret = defaultValue;
    if(option in icOptions) {
      ret = icOptions[option];
    }

    return ret;
  }

  async localizePage() {
    console.log("Options#localizePage");

    for (let el of document.querySelectorAll("[data-l10n-id]")) {
      let id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if(i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }
  }

  async updateUI() {
    var options = await browser.storage.local.get();

    console.log(options);

    for (const [optionName, optionValue] of Object.entries(options)) {
      console.log(`${optionName}: ${optionValue}`);

      var optionElement = document.getElementById(optionName);

      if(optionElement.tagName == "INPUT" &&
         optionElement.type == "checkbox") {

        optionElement.checked = optionValue;
      }
    }
  }

  async setupListeners() {
    console.log("Options#setupListeners");

    document.addEventListener("change", this.optionChanged);
  }

  async optionChanged(e) {
    console.log("Options#optionChanged");

    if(e == null) {
      return;
    }

    if(e.target.tagName == "INPUT" &&
       e.target.type == "checkbox") {
      var optionName = e.target.id;
      var optionValue = e.target.checked;

      console.log(optionName);
      console.log(optionValue);

      await browser.storage.local.set({
        [optionName]: optionValue
      });

      console.log("nach browser.storage.local.set");
    }
  }
}
