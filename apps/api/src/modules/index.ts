import { footballModule } from './football/football.module.js';
import { authModule } from './auth/auth.module.js';
import { messagesModule } from './messages/messages.module.js';
import { videosModule } from './videos/videos.module.js';
import type { ApiModule } from './module.types.js';
import { registerModules } from './registerModules.js';

export const apiModules: ApiModule[] = [
  authModule,
  messagesModule,
  videosModule,
  footballModule,
];

export { registerModules };
export type { ApiModule };
