import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const verifyMsg91AccessToken = asyncHandler(async (req, res) => {
  debugger;
  console.log('verifyMsg91AccessToken', req.body);
  
  const { accessToken } = req.body;
  const authkey = process.env.MSG91_AUTHKEY;

  if (!accessToken) {
    throw new ApiError(400, 'Missing accessToken');
  }
  if (!authkey) {
    throw new ApiError(500, 'MSG91 auth key not configured');
  }

  const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';
  const payload = { authkey, 'access-token': accessToken };

  const { data } = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  return res.status(200).json(new ApiResponse(200, data, 'OTP token verified'));
});

export { verifyMsg91AccessToken };
