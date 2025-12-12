import axios from 'axios';

const sendSms = async ({ to, message }) => {
  debugger;
  const authkey = process.env.MSG91_AUTHKEY;
  const sender = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE || '4';
  const country = process.env.SMS_COUNTRY_CODE || '91';
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authkey || !sender) {
    return { success: true, message: 'SMS simulated' };
  }

  const sms = { message, to: [to] };
  if (templateId) sms.dlttemplateid = templateId;

  const payload = {
    sender,
    route,
    country,
    sms: [sms],
  };

  const { data } = await axios.post('https://api.msg91.com/api/v2/sendsms', payload, {
    headers: { authkey, 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  return data;
};

export { sendSms };
