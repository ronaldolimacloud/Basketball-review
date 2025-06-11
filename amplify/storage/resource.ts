import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'basketballPlayerImages',
  access: (allow) => ({
    'public/player-images/*': [
      allow.guest.to(['read', 'write', 'delete']),
    ],
  })
}); 