/**
 * Utility to test EmailJS configuration
 * Run this in browser console: window.testEmailJS('your-email@example.com')
 */

import { testEmailJSConfig } from './emailService';

if (typeof window !== 'undefined') {
  window.testEmailJS = async (testEmail = 'test@example.com') => {
    console.log('Testing EmailJS configuration...');
    const result = await testEmailJSConfig(testEmail);
    console.log(result);
    return result;
  };
  
  console.log('EmailJS test function available. Run: window.testEmailJS("your-email@example.com")');
}

