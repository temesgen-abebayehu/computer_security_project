import axios from 'axios';

const verifyCaptcha = async (token) => {
  if (!token) return false;
  
  // Mock verification for development if no secret key provided or if using a mock key
  if (process.env.CAPTCHA_SECRET_KEY === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
    return true;
  }

  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const response = await axios.post(verifyUrl);
    return response.data.success;
  } catch (error) {
    console.error('Captcha verification error:', error);
    return false;
  }
};

export default verifyCaptcha;
