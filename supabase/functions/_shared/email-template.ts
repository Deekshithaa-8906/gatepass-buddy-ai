type EmailAction = {
  href: string;
  label: string;
};

type EmailCode = {
  value: string;
};

export type EmailTemplateOptions = {
  title: string;
  message: string;
  action?: EmailAction;
  code?: EmailCode;
  notice: string;
};

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  };
  return value.replace(/[&<>'"]/g, (character) => entities[character] ?? character);
}

function actionBlock(action: EmailAction) {
  const href = escapeHtml(action.href);
  const label = escapeHtml(action.label);

  return `
    <tr>
      <td align="center" style="padding:30px 0 28px;">
        <a href="${href}" style="display:inline-block;background:#cd0000;border-radius:10px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:20px;padding:15px 28px;text-align:center;text-decoration:none;">${label}</a>
      </td>
    </tr>
    <tr>
      <td style="color:#6f6f6f;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;padding:0 0 4px;">If the button does not work, copy and paste this link into your browser:</td>
    </tr>
    <tr>
      <td style="color:#cd0000;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;overflow-wrap:anywhere;padding:0;word-break:break-word;">${href}</td>
    </tr>`;
}

function codeBlock(code: EmailCode) {
  return `
    <tr>
      <td align="center" style="padding:32px 0 28px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #f0e7e7;border-radius:18px;box-shadow:0 2px 3px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="color:#cd0000;font-family:Arial,Helvetica,sans-serif;font-size:42px;font-weight:700;letter-spacing:10px;line-height:54px;padding:30px 20px 30px 30px;">${escapeHtml(code.value)}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/**
 * The single visual shell for Resend-delivered PassNTrack emails.
 * Only the copy and the optional code/link panel vary by email purpose.
 */
export function renderPassNTrackEmail(options: EmailTemplateOptions) {
  const feature = options.code ? codeBlock(options.code) : options.action ? actionBlock(options.action) : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;">
            <tr>
              <td align="center" style="color:#cd0000;font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:700;letter-spacing:-1.2px;line-height:42px;padding:0 0 48px;">PassNTrack</td>
            </tr>
            <tr>
              <td style="background:#f8f8f8;padding:0 32px 34px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="color:#141414;font-family:Arial,Helvetica,sans-serif;font-size:34px;font-weight:700;letter-spacing:-0.7px;line-height:42px;padding:42px 0 20px;">${escapeHtml(options.title)}</td>
                  </tr>
                  <tr>
                    <td align="center" style="color:#4d4d4d;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:29px;padding:0;">${escapeHtml(options.message)}</td>
                  </tr>
                  ${feature}
                  <tr>
                    <td style="padding-top:${feature ? '36px' : '30px'};">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f4;border-radius:28px;">
                        <tr>
                          <td style="color:#a27771;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;line-height:24px;padding:26px 16px 26px 28px;vertical-align:top;">&#9432;</td>
                          <td style="color:#80635f;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;padding:24px 28px 24px 0;">${escapeHtml(options.notice)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="color:#8a8a8a;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;padding:26px 12px 0;">PassNTrack &middot; Hostel Management</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
