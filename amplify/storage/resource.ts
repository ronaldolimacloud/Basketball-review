import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'basketballPlayerImages',
  access: (allow) => ({
    'protected/player-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public/team-assets/*': [
      allow.authenticated.to(['read']),
      allow.groups(['Coach']).to(['write', 'delete']),
    ],
    'public/game-videos/*': [
      allow.authenticated.to(['read']),
      allow.groups(['Coach']).to(['write', 'delete']),
    ],
  })
}); 