# Architettura Backend - LineUp.Api

Questo documento definisce la struttura a livelli (layered architecture) da seguire per **ogni nuova funzionalità** del backend. Obiettivo: separare le responsabilità, rendere il codice testabile e disaccoppiare la logica di business dall'accesso ai dati.

Lo strato di persistenza è basato sul **Repository Pattern**, con il seguente flusso di chiamata a senso unico:

```
Controller → Service → Proxy → Repository → DbContext (EF Core) → Database
```

Ogni livello parla solo con quello immediatamente sottostante. Non sono ammessi salti di livello (es. un Controller non deve mai iniettare un Repository o il `LineUpDbContext` direttamente).

---

## 1. Responsabilità dei livelli

### Controller (`Controllers/`)
* Riceve la richiesta HTTP, legge/valida i DTO in ingresso, applica gli attributi di routing e autorizzazione (`[Authorize]`, `[HttpPost]`, ecc.).
* Chiama **un solo Service** per eseguire l'operazione.
* Traduce il risultato in una risposta HTTP (`Ok()`, `NotFound()`, `BadRequest()`, ecc.).
* **Non contiene logica di business** e non conosce le entità del database: lavora esclusivamente con i DTO (`DTOs/`).

### Service (`Services/`)
* Contiene la **logica di business e le regole applicative**: validazioni di dominio, controlli sui permessi/ruoli, orchestrazione di più operazioni, gestione delle transazioni logiche.
* Effettua il mapping tra DTO ed entità di dominio (o delega il mapping al Proxy, vedi sotto).
* Chiama uno o più **Proxy** per leggere/scrivere dati. Non chiama mai un Repository direttamente.
* Lancia eccezioni di dominio (es. `InvalidOperationException`, eccezioni custom) che il Controller intercetta/traduce in risposte HTTP.

### Proxy (`Proxies/`)
* Livello di **disaccoppiamento tra business logic e accesso ai dati**: espone metodi "di dominio" (es. `GetLegaConPartecipantiAsync(int legaId)`) e internamente orchestra le chiamate a **uno o più Repository**.
* Utile quando un'operazione richiede dati da più entità/repository (es. comporre `Lega` + `UserLega` + `User`), o quando serve un punto centrale per introdurre in futuro caching, retry o chiamate a sistemi esterni senza toccare i Service.
* Non contiene regole di business (quelle restano nel Service): si limita a orchestrare l'accesso ai dati e a restituire oggetti già pronti per il Service.

### Repository (`Repositories/`)
* Unico livello che conosce **`LineUpDbContext`** e le entità EF Core in `Data/`.
* Espone operazioni CRUD/query mirate su una singola entità o aggregato (es. `IUserRepository`, `ILegaRepository`).
* Non contiene logica di business né mapping verso i DTO: lavora solo con le entità di `Data/`.
* Ogni Repository ha una interfaccia (`I{Nome}Repository`) per permettere il mocking nei test dei livelli superiori.

---

## 2. Struttura delle cartelle

```
LineUp.Api/
├── Controllers/
│   └── LegaController.cs
├── Services/
│   ├── ILegaService.cs
│   └── LegaService.cs
├── Proxies/
│   ├── ILegaProxy.cs
│   └── LegaProxy.cs
├── Repositories/
│   ├── ILegaRepository.cs
│   └── LegaRepository.cs
├── DTOs/
│   └── LegaDto.cs
└── Data/
    ├── LineUpDbContext.cs
    └── Lega.cs
```

Interfaccia e implementazione stanno **nella stessa cartella** (coerente con la convenzione già usata in `Services/` per `ITokenService`/`TokenService`).

---

## 3. Esempio end-to-end

Esempio semplificato per una feature "Team" (le entità `Team`/`Player` esistono già in `Data/`).

**Repository** — unico punto che tocca `LineUpDbContext`:
```csharp
// Repositories/ITeamRepository.cs
public interface ITeamRepository
{
    Task<List<Team>> GetAllWithPlayersAsync();
    Task<Team?> GetByIdAsync(int id);
    Task AddAsync(Team team);
}

// Repositories/TeamRepository.cs
public class TeamRepository : ITeamRepository
{
    private readonly LineUpDbContext _db;
    public TeamRepository(LineUpDbContext db) => _db = db;

    public Task<List<Team>> GetAllWithPlayersAsync() =>
        _db.Teams.Include(t => t.Players).ToListAsync();

    public Task<Team?> GetByIdAsync(int id) =>
        _db.Teams.Include(t => t.Players).FirstOrDefaultAsync(t => t.Id == id);

    public async Task AddAsync(Team team)
    {
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();
    }
}
```

**Proxy** — orchestrazione dell'accesso ai dati:
```csharp
// Proxies/ITeamProxy.cs
public interface ITeamProxy
{
    Task<List<Team>> GetAllTeamsAsync();
}

// Proxies/TeamProxy.cs
public class TeamProxy : ITeamProxy
{
    private readonly ITeamRepository _teamRepository;
    public TeamProxy(ITeamRepository teamRepository) => _teamRepository = teamRepository;

    public Task<List<Team>> GetAllTeamsAsync() => _teamRepository.GetAllWithPlayersAsync();
}
```

**Service** — logica di business + mapping verso i DTO:
```csharp
// Services/ITeamService.cs
public interface ITeamService
{
    Task<List<TeamDto>> GetAllTeamsAsync();
}

// Services/TeamService.cs
public class TeamService : ITeamService
{
    private readonly ITeamProxy _teamProxy;
    public TeamService(ITeamProxy teamProxy) => _teamProxy = teamProxy;

    public async Task<List<TeamDto>> GetAllTeamsAsync()
    {
        var teams = await _teamProxy.GetAllTeamsAsync();
        return teams.Select(t => new TeamDto { Id = t.Id, Nome = t.Nome }).ToList();
    }
}
```

**Controller** — solo HTTP + delega al Service:
```csharp
[ApiController]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;
    public TeamController(ITeamService teamService) => _teamService = teamService;

    [HttpGet]
    public async Task<ActionResult<List<TeamDto>>> GetAll() =>
        Ok(await _teamService.GetAllTeamsAsync());
}
```

**Registrazione DI** in `Program.cs`:
```csharp
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<ITeamProxy, TeamProxy>();
builder.Services.AddScoped<ITeamService, TeamService>();
```

---

## 4. Regole rapide (Do / Don't)

* ✅ Il Controller inietta solo Service.
* ✅ Il Service inietta solo Proxy.
* ✅ Il Proxy inietta solo Repository (uno o più).
* ✅ Solo i Repository conoscono `LineUpDbContext` e le entità EF.
* ✅ Solo Controller e Service conoscono i DTO.
* ❌ Mai iniettare `LineUpDbContext` in un Controller o in un Service.
* ❌ Mai far restituire entità EF (`Data/*.cs`) da un Controller: convertire sempre in DTO nel Service.
* ❌ Mai mettere regole di business dentro un Repository o un Proxy.
* ❌ Evitare i Minimal API endpoint diretti su `LineUpDbContext` (come gli attuali `/api/teams` e `/api/players` in `Program.cs`): vanno migrati a `Controller → Service → Proxy → Repository` quando vengono modificati.

---

## 5. Stato attuale e migrazione

Il codice esistente (`AuthController`, endpoint minimal API in `Program.cs`) non segue ancora questo pattern. Non è richiesto un refactor massivo immediato: **ogni nuova feature deve nascere con questa struttura**, e il codice legacy va allineato gradualmente quando viene toccato per altre modifiche.
