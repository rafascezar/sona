// The sona theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in sona.settings.json and the generated sona.settings.ts;
// change them with `astryx experimental theme editor set sona ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {sonaSettings} from './sona.settings';

export const sonaTheme = defineTheme({
  extends: sonaSettings,
  name: 'sona',
});
