// Common utilities for Lambda functions

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Org-Id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

const extractOrgId = (headers) => {
  return headers['X-Org-Id'] || headers['x-org-id'] || 'default';
};

const validateOrgId = (orgId) => {
  return orgId && orgId !== 'undefined';
};

const createResponse = (statusCode, body, headers = corsHeaders) => {
  return {
    statusCode,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

const createErrorResponse = (statusCode, message) => {
  return createResponse(statusCode, {
    success: false,
    error: { message }
  });
};

const createSuccessResponse = (data, statusCode = 200) => {
  return createResponse(statusCode, {
    success: true,
    data
  });
};

const handleOptionsRequest = () => {
  return createResponse(200, '');
};

module.exports = {
  corsHeaders,
  extractOrgId,
  validateOrgId,
  createResponse,
  createErrorResponse,
  createSuccessResponse,
  handleOptionsRequest
};