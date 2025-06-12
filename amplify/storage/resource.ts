import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'basketballPlayerImages',
  access: (allow) => ({
    'protected/player-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  })
}); 