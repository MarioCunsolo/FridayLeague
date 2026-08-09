using System;

namespace LineUp.Api.Data;

public class ActivityLog
{
    public int Id { get; set; }
    public Guid LegaId { get; set; }
    public Guid EsecutoreId { get; set; }
    public string EsecutoreNome { get; set; } = string.Empty;
    public string EsecutoreRuolo { get; set; } = string.Empty;
    public string Azione { get; set; } = string.Empty;
    public Guid? TargetUserId { get; set; }
    public string TargetUserNome { get; set; } = string.Empty;
    public string Dettagli { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Lega? Lega { get; set; }
}
