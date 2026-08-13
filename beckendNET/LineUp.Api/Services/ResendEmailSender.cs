using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace LineUp.Api.Services;

public class ResendEmailSender(HttpClient httpClient, IOptions<EmailOptions> emailOptions) : IEmailSender
{
    public async Task<string?> SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationUrl,
        string brandLogoUrl,
        CancellationToken cancellationToken = default)
    {
        var options = emailOptions.Value;
        var html = EmailVerificationTemplate.CreateHtml(recipientName, verificationUrl, brandLogoUrl);
        var plainText = EmailVerificationTemplate.CreatePlainText(recipientName, verificationUrl);

        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new
            {
                from = $"{options.FromName} <{options.FromAddress}>",
                to = new[] { recipientEmail },
                subject = "Attiva il tuo account LineUp",
                html,
                text = plainText
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ResendApiKey);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<ResendEmailResponse>(cancellationToken: cancellationToken);
        return payload?.Id;
    }

    private class ResendEmailResponse
    {
        public string? Id { get; set; }
    }
}
