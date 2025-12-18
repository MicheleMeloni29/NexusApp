## Backend (FastAPI)

Questo backend fornisce gli endpoint per autenticare gli utenti con Steam e Riot, sincronizzare le statistiche e restituire il payload per il `VideoRecap`.

### Requisiti

- Python 3.11+
- `pip` o un gestore virtualenv equivalente

### Installazione rapida

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

L'API sarà disponibile su `http://localhost:8000`. Il frontend può puntare a questa istanza impostando `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`.

### Configurazione

Crea un file `.env` nella cartella `backend/` con le variabili:

```
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=sqlite:///./nexus.db
STEAM_API_KEY=...
STEAM_RETURN_URL=http://localhost:8000/api/v1/auth/steam/callback
STEAM_REALM=http://localhost:3000
RIOT_CLIENT_ID=...
RIOT_CLIENT_SECRET=...
RIOT_REDIRECT_URI=http://localhost:8000/api/v1/auth/riot/callback
RIOT_SCOPE=openid offline_access
RIOT_REGION=eu
RIOT_API_KEY=...
RIOT_LOL_REGION=euw1
RIOT_MATCH_REGION=europe
```

I valori sono facoltativi per ora ma già pronti per l'integrazione reale.

### Struttura router

- `/api/v1/auth/*` – avvio e callback per login Steam (OpenID) e Riot (OAuth).
- `/api/v1/sync/*` – punti di ingresso per avviare la sincronizzazione statistica.
- `/api/v1/recap` – restituisce un `UserStats` fittizio utile per alimentare il componente `VideoRecap`.
- `/health` – verifica rapida dello stato del servizio per i load balancer.

Gli endpoint contengono già la logica base per gestire gli state token, verificare le risposte di Steam/Riot e salvare utenti/token sul database; vanno ora collegati alle chiavi reali e alle statistiche che alimenteranno il recap.

### Sincronizzazione

Dopo aver collegato almeno una piattaforma puoi aggiornare le statistiche chiamando:

```bash
curl -X POST "http://localhost:8000/api/v1/sync/steam?user_id=1"
curl -X POST "http://localhost:8000/api/v1/sync/riot?user_id=1"
```

Entrambi gli endpoint interrogano le API ufficiali (Steam WebAPI, Riot Games) usando gli ID salvati durante l'autenticazione e memorizzano i dati aggregati (`SteamStats`, `RiotStats`) che poi alimenteranno il recap.

### Admin UI

È disponibile una console amministrativa in stile Django grazie a [SQLAdmin]. Una volta avviato il server puoi aprire `http://localhost:8000/admin` per consultare/modificare utenti, token Riot e (in futuro) altri modelli persistiti. Al momento non è abilitata l’autenticazione: ricordati di proteggerla dietro un proxy o aggiungere Basic/OAuth prima del deploy pubblico.

[SQLAdmin]: https://github.com/tiangolo/sqladmin
