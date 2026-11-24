(() => {
  const $ = (selector) => document.querySelector(selector);
  const batchSize = 15;
  let canManageMarketing = false;
  let csrfToken = '';
  let emails = [];
  let batchIndex = 0;
  let loading = false;

  const status = (message) => {
    const node = $('#marketingStatus');
    if (node) node.textContent = message;
  };

  function currentBatch() {
    return emails.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
  }

  function render() {
    const count = $('#marketingRecipientCount');
    const note = $('#marketingAudienceNote');
    const label = $('#marketingBatchLabel');
    const previous = $('#marketingPrevious');
    const next = $('#marketingNext');
    const compose = $('#composeMarketing');
    const copy = $('#copyMarketingBcc');
    const totalBatches = Math.max(1, Math.ceil(emails.length / batchSize));
    if (count) count.textContent = String(emails.length);
    if (note) note.textContent = emails.length
      ? 'Unique email addresses with a recorded opt-in.'
      : 'No opted-in enquiry emails are available yet.';
    if (label) label.textContent = `Batch ${batchIndex + 1} of ${totalBatches}`;
    if (previous) previous.disabled = loading || batchIndex <= 0;
    if (next) next.disabled = loading || batchIndex + 1 >= totalBatches;
    if (compose) compose.disabled = loading || emails.length === 0;
    if (copy) copy.disabled = loading || emails.length === 0;
    const refresh = $('#refreshMarketing');
    if (refresh) refresh.disabled = loading;
  }

  async function loadRecipients() {
    if (!canManageMarketing || loading) return;
    loading = true;
    render();
    status('Refreshing the consented guest list…');
    try {
      const response = await fetch('/api/admin/marketing/recipients', { credentials: 'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'The guest list could not be loaded.');
      emails = [...new Set((Array.isArray(data.emails) ? data.emails : [])
        .map((email) => String(email).trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
      batchIndex = 0;
      status(emails.length
        ? 'Only guests who opted in are included. Review your message and send it from your email app.'
        : 'No opted-in guest addresses yet. New enquiries are included only when the guest checks the optional preference.');
    } catch (error) {
      emails = [];
      status(error.message || 'The guest list could not be loaded.');
    } finally {
      loading = false;
      render();
    }
  }

  function openEmail() {
    const recipients = currentBatch();
    const subject = $('#marketingSubject')?.value.trim() || '';
    const message = $('#marketingBody')?.value.trim() || '';
    if (!recipients.length) return status('There are no opted-in addresses in this batch.');
    if (!subject || !message) return status('Add a subject and message before opening your email app.');
    const mailto = `mailto:?bcc=${encodeURIComponent(recipients.join(','))}`
      + `&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    if (mailto.length > 1900) return status('This message is too long for a reliable email link. Shorten the message or copy this batch’s BCC and paste it into a new email.');
    window.location.href = mailto;
    status(`Your email app should open with ${recipients.length} opted-in guest${recipients.length === 1 ? '' : 's'} in BCC. Review the message and send it there.`);
  }

  async function copyBcc() {
    const recipients = currentBatch();
    if (!recipients.length) return status('There are no opted-in addresses in this batch.');
    try {
      await navigator.clipboard.writeText(recipients.join(', '));
      status(`${recipients.length} opted-in address${recipients.length === 1 ? '' : 'es'} copied. Paste them into BCC.`);
    } catch (_) {
      status('Clipboard access is unavailable here. Use “Compose bulk email” to add this batch in BCC.');
    }
  }

  async function updateSuppression(action) {
    const email = $('#marketingSuppressionEmail')?.value.trim().toLowerCase() || '';
    const notice = $('#marketingSuppressionStatus');
    const buttons = [$('#suppressMarketingEmail'), $('#restoreMarketingEmail')].filter(Boolean);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (notice) notice.textContent = 'Enter a valid guest email address.';
      return;
    }
    buttons.forEach((button) => { button.disabled = true; });
    if (notice) notice.textContent = action === 'suppress' ? 'Adding this address to the do-not-email list…' : 'Checking for a new explicit opt-in…';
    try {
      const response = await fetch('/api/admin/marketing/suppress', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ email, action })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'The email preference could not be saved.');
      if (action === 'suppress') $('#marketingSuppressionEmail').value = '';
      await loadRecipients();
      if (notice) notice.textContent = action === 'suppress'
        ? 'Address suppressed. It will not appear in future campaign batches.'
        : 'Address restored after a new explicit opt-in.';
    } catch (error) {
      if (notice) notice.textContent = error.message || 'The email preference could not be saved.';
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  $('#marketingSuppressionForm')?.addEventListener('submit', (event) => event.preventDefault());
  $('#suppressMarketingEmail')?.addEventListener('click', () => updateSuppression('suppress'));
  $('#restoreMarketingEmail')?.addEventListener('click', () => updateSuppression('restore'));
  $('#refreshMarketing')?.addEventListener('click', loadRecipients);
  $('#marketingPrevious')?.addEventListener('click', () => {
    batchIndex = Math.max(0, batchIndex - 1);
    render();
    status(`Batch ${batchIndex + 1} of ${Math.max(1, Math.ceil(emails.length / batchSize))} is ready.`);
  });
  $('#marketingNext')?.addEventListener('click', () => {
    batchIndex = Math.min(Math.ceil(emails.length / batchSize) - 1, batchIndex + 1);
    render();
    status(`Batch ${batchIndex + 1} of ${Math.max(1, Math.ceil(emails.length / batchSize))} is ready.`);
  });
  $('#composeMarketing')?.addEventListener('click', openEmail);
  $('#copyMarketingBcc')?.addEventListener('click', copyBcc);
  window.addEventListener('ginnery-marketing-view', loadRecipients);
  window.addEventListener('ginnery-auth', (event) => {
    canManageMarketing = Boolean(event.detail?.user?.permissions?.includes('marketing'));
    csrfToken = String(event.detail?.csrfToken || '');
    if (canManageMarketing && document.querySelector('#view-marketing.active')) loadRecipients();
  });
})();
