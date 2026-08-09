namespace LineUp.Api.Extensions;

public static class PlayerDisplayExtensions
{
    // Palette fissa e deterministica: stesso utente -> stesso colore ad ogni chiamata, senza doverlo persistere a DB.
    private static readonly string[] Palette =
    {
        "#00cc66", "#3399ff", "#ffcc00", "#ff4444", "#9933ff", "#ff9933", "#33cccc"
    };

    public static string GetInitials(string nome, string cognome)
    {
        var n = string.IsNullOrEmpty(nome) ? "" : nome[..1];
        var c = string.IsNullOrEmpty(cognome) ? "" : cognome[..1];
        var initials = (n + c).ToUpper();
        return string.IsNullOrEmpty(initials) ? "??" : initials;
    }

    public static string GetAvatarColor(Guid userId) => Palette[Math.Abs(userId.GetHashCode()) % Palette.Length];
    public static string GetAvatarColor(string userKey) => Palette[Math.Abs(userKey.GetHashCode()) % Palette.Length];
}
