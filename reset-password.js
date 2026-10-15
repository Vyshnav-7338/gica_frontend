const resetForm = document.querySelector('#reset-form');
const resetStatus = resetForm.querySelector('.form-status');
let sentEmail = '';
let verificationToken = '';

function status(message, error = false) {
  resetStatus.textContent = message;
  resetStatus.classList.toggle('error', error);
}

resetForm.elements.email.addEventListener('input', () => {
  if (resetForm.elements.email.value.trim().toLowerCase() !== sentEmail) verificationToken = '';
});

document.querySelector('#reset-send').addEventListener('click', async event => {
  const email = resetForm.elements.email.value.trim().toLowerCase();
  if (!resetForm.elements.email.checkValidity()) { resetForm.elements.email.reportValidity(); return; }
  event.currentTarget.disabled = true;
  try {
    await GicaApi.request('/api/emailotp/sendotp', { method: 'POST', body: { email } });
    sentEmail = email;
    verificationToken = '';
    status('Verification code sent. Check your email.');
  } catch (error) { status(error.message, true); }
  finally { event.currentTarget.disabled = false; }
});

document.querySelector('#reset-verify').addEventListener('click', async event => {
  const otp = resetForm.elements.otp.value.trim();
  if (!sentEmail || !/^\d{6}$/.test(otp)) { status('Enter the six-digit code sent to your email.', true); return; }
  event.currentTarget.disabled = true;
  try {
    const result = await GicaApi.request('/api/emailotp/verifyotp', {
      method: 'POST', body: { email: sentEmail, otp },
    });
    verificationToken = result.verificationToken;
    status('Email verified. Enter your new password.');
  } catch (error) { status(error.message, true); }
  finally { event.currentTarget.disabled = false; }
});

resetForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!verificationToken) { status('Verify your email first.', true); return; }
  const password = resetForm.elements.password.value;
  const confirmPassword = resetForm.elements.confirmPassword.value;
  if (password !== confirmPassword) { status('Passwords must match.', true); return; }
  const button = resetForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await GicaApi.request('/api/password-reset', {
      method: 'POST', body: { emailVerificationToken: verificationToken, password, confirmPassword },
    });
    status('Password updated. Opening login…');
    setTimeout(() => { location.href = 'login.html'; }, 1000);
  } catch (error) { status(error.message, true); button.disabled = false; }
});
