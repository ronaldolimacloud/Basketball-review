import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'basketballMediaStorage',
  access: (allow) => ({
    'protected/player-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/team-logos/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/game-videos/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/processed-videos/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/video-thumbnails/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/video-clips/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/clip-thumbnails/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  })
}); 