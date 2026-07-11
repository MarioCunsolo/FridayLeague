using System;

namespace LineUp.Api.DTOs;

public class ActivityLogDto
{
    public int Id { get; set; }
    public int EsecutoreId { get; set; }
    public string EsecutoreNome { get; set; } = string.Empty;
    public string EsecutoreRuolo { get; set; } = string.Empty;
    public string Azione { get; set; } = string.Empty;
    public int? TargetUserId { get; set; }
    public string TargetUserNome { get; set; } = string.Empty;
    public string Dettagli { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
