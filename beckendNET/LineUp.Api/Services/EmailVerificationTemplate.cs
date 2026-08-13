using System.Net;

namespace LineUp.Api.Services;

/// <summary>
/// Template condiviso per le email di attivazione, compatibile con i client email
/// grazie al layout basato su tabelle e agli stili inline.
/// </summary>
public static class EmailVerificationTemplate
{
    public static string CreateHtml(string recipientName, string verificationUrl, string brandLogoUrl)
    {
        var encodedName = WebUtility.HtmlEncode(recipientName);
        var encodedUrl = WebUtility.HtmlEncode(verificationUrl);
        var encodedLogoUrl = WebUtility.HtmlEncode(brandLogoUrl);

        return $"""
            <!doctype html>
            <html lang="it">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Attiva il tuo account LineUp</title>
              </head>
              <body style="margin:0;padding:0;background-color:#0f1115;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Conferma il tuo indirizzo email per iniziare a usare LineUp.</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background-color:#0f1115;">
                  <tr>
                    <td align="center" style="padding:36px 16px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
                        <tr>
                          <td style="padding:0 0 20px 8px;">
                            <span style="color:#00cc66;font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1;">LineUp</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="overflow:hidden;background-color:#1a1a1c;border:1px solid #333333;border-radius:24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="height:5px;background-color:#00cc66;font-size:0;line-height:0;">&nbsp;</td>
                              </tr>
                              <tr>
                                <td style="padding:36px 40px 32px;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                      <td align="center" valign="middle" width="48" height="48" style="width:48px;height:48px;background-color:#00cc66;border-radius:14px;color:#000000;font-size:27px;font-weight:700;line-height:48px;">✓</td>
                                      <td style="padding-left:14px;color:#00cc66;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Account LineUp</td>
                                    </tr>
                                  </table>

                                  <h1 style="margin:28px 0 12px;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-0.6px;line-height:1.18;">Attiva il tuo account</h1>
                                  <p style="margin:0;color:#aaaaaa;font-size:16px;line-height:1.6;">Ciao <strong style="color:#ffffff;font-weight:700;">{encodedName}</strong>, benvenuto in LineUp.</p>
                                  <p style="margin:14px 0 0;color:#aaaaaa;font-size:16px;line-height:1.6;">Conferma il tuo indirizzo email per completare la registrazione e iniziare a creare o unirti alla tua lega.</p>

                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 0;background-color:#111111;border:1px solid #2a2a2a;border-radius:14px;">
                                    <tr>
                                      <td style="padding:16px 18px;">
                                        <p style="margin:0 0 4px;color:#ffffff;font-size:14px;font-weight:700;line-height:1.4;">Un ultimo passaggio</p>
                                        <p style="margin:0;color:#aaaaaa;font-size:14px;line-height:1.5;">Il link è personale e rimane valido per 24 ore.</p>
                                      </td>
                                    </tr>
                                  </table>

                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
                                    <tr>
                                      <td align="center" bgcolor="#00cc66" style="border-radius:12px;">
                                        <a href="{encodedUrl}" style="display:inline-block;padding:16px 24px;color:#000000;font-size:16px;font-weight:800;line-height:1;text-decoration:none;">Attiva il tuo account&nbsp; →</a>
                                      </td>
                                    </tr>
                                  </table>

                                  <p style="margin:30px 0 0;color:#888888;font-size:13px;line-height:1.55;">Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
                                  <p style="margin:8px 0 0;word-break:break-all;"><a href="{encodedUrl}" style="color:#00cc66;font-size:12px;line-height:1.5;text-decoration:underline;">{encodedUrl}</a></p>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding:24px 40px 18px;background-color:#151517;border-top:1px solid #2a2a2a;">
                                  <img src="{encodedLogoUrl}" width="44" alt="Logo LineUp" style="display:block;width:44px;height:auto;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
                                  <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;line-height:1.4;">LineUp</p>
                                  <p style="margin:4px 0 0;color:#888888;font-size:12px;line-height:1.5;">La tua squadra, sempre in campo.</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:18px 40px;background-color:#151517;border-top:1px solid #2a2a2a;">
                                  <p style="margin:0;color:#888888;font-size:12px;line-height:1.55;">Se non hai richiesto la registrazione su LineUp, puoi ignorare questa email: il tuo account non verrà attivato.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:20px 12px 0;color:#666666;font-size:12px;line-height:1.5;">LineUp · Organizza le tue partite, una squadra alla volta.</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """;
    }

    public static string CreatePlainText(string recipientName, string verificationUrl) =>
        $"""
        Ciao {recipientName},

        benvenuto in LineUp. Conferma il tuo indirizzo email per completare la registrazione:
        {verificationUrl}

        Il link è personale ed è valido per 24 ore. Se non hai richiesto la registrazione, puoi ignorare questa email.
        """;
}
