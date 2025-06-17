import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource with role-based authentication
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['Coach', 'Player', 'Parent'],
  userAttributes: {
    preferredUsername: {
      required: false,
      mutable: true,
    },
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
    'custom:teamCodes': {
      dataType: 'String',
      mutable: true,
    },
    'custom:playerId': {
      dataType: 'String',
      mutable: true,
    },
  },
});
