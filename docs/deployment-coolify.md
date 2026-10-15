# Deployment auf Coolify

Diese Anleitung beschreibt das Deployment von DARE auf einer [Coolify](https://coolify.io)-Instanz
(v4). Das Setup besteht aus **zwei Ressourcen in einem Coolify-Projekt** und benötigt nach der
Einrichtung keinen manuellen Schritt mehr pro Deployment.

```
Coolify-Projekt "dare"
├── dare-db   → PostgreSQL 17 (von Coolify verwaltet, inkl. Backups)
└── dare-app  → Application, Build Pack "Dockerfile"
                Port 3000 · API (/trpc, /health, /principles, /decks, /webhooks) + SPA
```

**Warum diese Aufteilung und nicht die `docker-compose.yml` des Repos?**
Die verwaltete Datenbank bekommt Backup/Restore, Credential-Rotation und Monitoring direkt in der
Coolify-UI; die App bleibt ein reiner Dockerfile-Build ohne Deployment-Secrets im Repository.
Die `docker-compose.yml` bleibt damit das, was sie ist: das lokale Entwicklungs-Setup.

## Vorher lokal testen (empfohlen)

`docker-compose.yml` baut dasselbe Dockerfile und setzt dieselben Variablen, die später in Coolify
stehen — damit lässt sich das Produktionsabbild einmal komplett durchspielen, bevor der Server
involviert ist:

```bash
cp .env.example .env     # falls noch nicht vorhanden, Tokens eintragen
docker compose up -d --build
curl localhost:3000/health          # {"status":"ok","timestamp":"…"}
curl localhost:3000/principles      # Seed-Daten
open http://localhost:3000          # SPA im Production-Build
docker compose logs -f app          # Migration → Seed → Nest-Start
docker compose down
```

Compose liest die Plattform-Variablen aus `./.env`; `DATABASE_URL` wird bewusst überschrieben und
zeigt auf den `postgres`-Service. Der Container ist nach ca. 30 s `healthy` — das ist derselbe
Healthcheck, den Coolify später zum Umschalten nutzt.

Das deckt ab: Build, Migration, Seed, Healthcheck, API, SPA-Fallback und fehlende Variablen.
Das deckt **nicht** ab: Traefik-Routing, Domain und TLS, die Coolify-Env-Injektion sowie den
Auto-Deploy-Webhook — diese Teile lassen sich erst auf der Coolify-Instanz prüfen.

## Voraussetzungen

* Coolify v4 auf einem Server mit Docker und aktivem Traefik-Proxy.
* **Netzwerkzugang zum Git-Remote:** Der Coolify-Server muss
  `gitlab.informatik.hs-augsburg.de:2222` per SSH erreichen. Ist die Hochschul-GitLab-Instanz von
  außen nicht erreichbar, siehe [Alternative ohne Git-Zugriff](#alternative-ohne-git-zugriff).
* DNS: A-Record der Wunsch-Domain auf die Server-IP (vor dem ersten Deploy, sonst schlägt die
  Let's-Encrypt-Ausstellung fehl).
* Ein GitLab- bzw. GitHub-Access-Token für die Plattform-Integration (siehe Schritt 3).

## Schritt 1 — PostgreSQL anlegen

1. *New Resource → Databases → PostgreSQL*, Version **17** (identisch zur lokalen Entwicklung).
2. Name: `dare-db`. Passwort generiert Coolify selbst.
3. **Public Access ausgeschaltet lassen** — die App erreicht die DB über das interne Docker-Netz.
4. Datenbank starten und die **interne** Connection-URL kopieren (Tab *Postgres URL (internal)*):
   `postgres://postgres:<passwort>@<container-name>:5432/postgres`
5. *Backups* → *Scheduled Backup* aktivieren (z. B. täglich, Retention nach Bedarf). Coolify nutzt
   `pg_dump`; optional mit S3-Ziel.

## Schritt 2 — Application anlegen

1. *New Resource → Private Repository (with deploy key)* — passend für die selbst gehostete
   GitLab-Instanz; ein OAuth-/GitHub-App-Setup ist dafür nicht nötig.
   * Repository: `ssh://git@gitlab.informatik.hs-augsburg.de:2222/hsa_ias/students/ss26/dare-to-build.git`
     (der Port `2222` muss Teil der URL sein)
   * Branch: `main`
   * Coolify erzeugt ein SSH-Keypair → Public Key in GitLab unter
     *Settings → Repository → Deploy keys* hinterlegen (Read-only genügt).
2. **Build Pack: `Dockerfile`**
   * *Base Directory:* `/`
   * *Dockerfile Location:* `/Dockerfile`
3. **Ports Exposes: `3000`** — der Prozess lauscht auf `0.0.0.0:3000` (`PORT` ist im Image gesetzt).
4. *Domains:* `https://dare.example.org` eintragen. Coolify konfiguriert Traefik und das
   Let's-Encrypt-Zertifikat automatisch.

## Schritt 3 — Environment-Variablen

Alle Variablen sind **Runtime-Variablen**. Bei jeder Variable die Option *Is build variable?*
**deaktivieren** — der Build braucht keine davon (die `DATABASE_URL` zur Build-Zeit ist ein
Platzhalter aus dem `ARG` im Dockerfile, weil `prisma generate` nur die Config lädt und keine
Verbindung öffnet).

| Variable | Wert | Pflicht |
|---|---|---|
| `DATABASE_URL` | interne Postgres-URL aus Schritt 1 | ja |
| `PM_PLATFORM` | `gitlab` oder `github` | ja |
| `GITLAB_API_URL` | z. B. `https://gitlab.informatik.hs-augsburg.de` | bei `gitlab` |
| `GITLAB_ACCESS_TOKEN` | Personal/Project Access Token (`api`) | bei `gitlab` |
| `GITLAB_PROJECT_PATH` | `owner/repo` oder numerische Projekt-ID | bei `gitlab` |
| `GITLAB_WEBHOOK_SECRET` | frei gewähltes Secret, identisch zum GitLab-Webhook | bei `gitlab` |
| `GITHUB_API_URL` | `https://api.github.com` bzw. `https://<host>/api/v3` | bei `github` |
| `GITHUB_ACCESS_TOKEN` | Fine-grained: Org-Recht „Issue fields" (RW) + Repo-Recht „Issues" (RW); classic: `admin:org` + `repo` | bei `github` |
| `GITHUB_PROJECT_PATH` | beobachtetes Repo als `owner/repo` | bei `github` |
| `GITHUB_ISSUE_FIELD_NAME` | Default `Principles` | nein |
| `GITHUB_WEBHOOK_SECRET` | Secret des GitHub-Webhooks | bei `github` |

`NODE_ENV=production` und `PORT=3000` setzt bereits das Image — nicht erneut eintragen.
`SMEE_URL` ist ausschließlich ein lokales Entwicklungs-Hilfsmittel und gehört nicht nach Coolify.

> Ohne gültigen `GITLAB_ACCESS_TOKEN` (bzw. `GITHUB_ACCESS_TOKEN`) bricht der Container beim Start
> mit `GITLAB_ACCESS_TOKEN is not set` ab — die Plattform-Module werden beim Bootstrap validiert.

## Schritt 4 — Healthcheck

Das Image bringt einen eigenen `HEALTHCHECK` auf `GET /health` mit. In der Coolify-UI zusätzlich
unter *Healthcheck* setzen, damit der Proxy erst nach dem Hochlaufen umschaltet:

| Feld | Wert |
|---|---|
| Path | `/health` |
| Port | `3000` |
| Interval / Timeout / Retries | `30s` / `5s` / `3` |

`/health` antwortet mit `{"status":"ok","timestamp":"…"}`.

## Schritt 5 — Deployen

*Deploy* klicken. Der Build läuft auf dem Coolify-Server (ca. 2–3 Minuten, Image ≈ 540 MB).
Erfolgreiche Start-Logs sehen so aus:

```
All migrations have been successfully applied.
Starting seed data insertion...
✓ Seeded principle: P001_beneficence
...
[Nest] LOG [NestApplication] Nest application successfully started
DARE server running on port 3000
```

Der Container führt bei **jedem** Start `prisma migrate deploy` und anschließend den Seed aus. Der
Seed ist idempotent (`upsert` der neun Prinzipien), Migrationen werden über die Tabelle
`_prisma_migrations` nur einmal angewendet. Ein Deployment braucht deshalb keinen manuellen
Migrationsschritt.

> **Nur eine Instanz:** Migration und Seed laufen im App-Container. Beim Hochskalieren auf mehrere
> Replicas würden sie parallel starten. Wenn skaliert werden soll, die Migration vorher als
> *Pre-deployment Command* ausführen und aus dem `CMD` entfernen.

## Schritt 6 — Auto-Deploy bei Push

1. In der Application: *Webhooks* → die **GitLab Manual Webhook**-URL und das Secret kopieren.
2. In GitLab: *Settings → Webhooks → Add new webhook*, URL und *Secret token* einsetzen,
   Trigger **Push events** auf den Deploy-Branch beschränken.

Damit baut Coolify bei jedem Push auf den konfigurierten Branch neu und schwenkt nach erfolgreichem
Healthcheck um (Zero-Downtime-Option in Coolify aktivierbar).

## Schritt 7 — Plattform-Webhooks auf die App zeigen

Damit DARE Issue-Änderungen empfängt, zusätzlich zum Deploy-Webhook:

| Plattform | URL | Events | Content type | Secret |
|---|---|---|---|---|
| GitLab | `https://<domain>/webhooks/gitlab` | Issues events | — | `GITLAB_WEBHOOK_SECRET` |
| GitHub | `https://<domain>/webhooks/github` | **Issues** + **Sub-issues** | `application/json` | `GITHUB_WEBHOOK_SECRET` |

Bei GitHub ist `application/json` zwingend: Die Signatur ist ein HMAC über den **Rohbody**, und
`x-www-form-urlencoded` zerstört sowohl die Prüfung als auch das Parsen. Registriert wird der
Webhook am **Repository** (oder org-weit) — ein Projects-Board hat keine Webhook-Konfiguration.
Welche Issues DARE verarbeitet, entscheidet der Payload (`repository.full_name`), nicht
`GITHUB_PROJECT_PATH`: ein org-weiter Webhook lässt also alle Repos durchlaufen.

Die Endpunkte sind `POST`-Routen und werden vom SPA-Fallback nicht abgefangen. Gemountet wird
immer nur der Adapter der über `PM_PLATFORM` aktiven Plattform — bei `PM_PLATFORM=github`
antwortet `/webhooks/gitlab` mit `404`, und umgekehrt. Ein Request ohne gültige Signatur wird
mit `403` abgelehnt; das ist der schnellste Test, ob Secret und Route zusammenpassen.

## Einmalig auf GitHub vorbereiten (nur bei `PM_PLATFORM=github`)

Das Prinzip-Vokabular ist auf GitHub ein organisationsweites **Issue Field**, kein Label. DARE legt
das Feld beim ersten Sync selbst an (`ensureLabels`), aber zwei Dinge kann die API nicht:

1. **Feld an Issue-Typen pinnen.** Ein per API erzeugtes Feld erscheint nicht im Issue-Formular —
   laut GitHub-Doku *„Fields must be pinned to at least one issue type, or to 'Issues without a
   type', to appear in the issue sidebar."* Weder REST noch GraphQL haben dafür einen Parameter
   (geprüft: alle Mutationen, `Create/UpdateIssueFieldInput`, `Create/UpdateIssueTypeInput`, dazu
   undokumentierte REST-Pfade → 404). Also einmalig in der UI:
   *Organization Settings → Planning → Issue fields → Principles → Pin to types* und dort auch
   „Issues without a type" setzen, falls Issues ohne Typ geführt werden.
2. **Token-Rechte erteilen.** Fine-grained Token: *Organization permissions → „Issue fields"*
   (Read and write, Resource owner = die Organisation) plus *Repository permissions → „Issues"*
   (Read and write). Das Feld **anlegen** darf nur ein Org-Admin. Klassischer PAT: `admin:org` +
   `repo`. Repositories unter einem persönlichen Konto haben keine Issue Fields.

Die Zuordnung lässt sich per GraphQL nachlesen (`IssueType.pinnedFields`), nur nicht schreiben.

## Alternative ohne Git-Zugriff

Erreicht der Coolify-Server die Hochschul-GitLab-Instanz nicht, zwei leichtgewichtige Wege:

1. **Mirror:** GitLab-Projekt per *Repository mirroring* auf ein erreichbares Remote spiegeln und
   Coolify dort anbinden — am Deployment selbst ändert sich nichts.
2. **Vorgebautes Image:** `docker build -t <registry>/dare:<tag> .` lokal oder in der CI, Push in
   eine Registry, und in Coolify *New Resource → Docker Image* statt des Git-Builds wählen.
   Environment-Variablen, Port und Healthcheck sind identisch zu Schritt 3/4.

## Betrieb

* **Logs / Shell:** Application → *Logs* bzw. *Terminal*.
* **Rollback:** Coolify kann auf ein früheres Image zurückschalten. Achtung: Datenbank-Migrationen
  werden dadurch **nicht** zurückgenommen — vor einem Rollback über eine Schema-Änderung hinweg das
  DB-Backup aus Schritt 1 einplanen.
* **DB-Zugriff von außen** (z. B. Prisma Studio): in `dare-db` temporär *Public Access* aktivieren,
  Coolify öffnet einen TCP-Proxy-Port; danach wieder abschalten.
* **`403 Forbidden` von `search/issues` im Log** ist in der Regel kein Rechteproblem, sondern das
  Limit der GitHub-Suche von 30 Anfragen/Minute: Ein Deck-Sync feuert eine Suche **pro Prinzip**
  (bei vollem Deck neun), mehrere Syncs in Folge laufen also ins sekundäre Rate-Limit. Der Sync ist
  non-blocking — das Deck wird trotzdem gespeichert, die Kommentare zieht der nächste Lauf nach.
  Der Webhook-Pfad nutzt keine Suche und ist davon nicht betroffen.
* **Entfernt jemand ein Prinzip am Issue, löscht DARE den zugehörigen Kommentar.** Das ist
  gewolltes Verhalten (`PrincipleCommentService`, Aufräumen veralteter Mappings) und keine
  Fehlfunktion — relevant zu wissen, bevor man es für Datenverlust hält.
* **Identität einer Installation ist der Projektpfad** (`owner/repo` bzw. `path_with_namespace`).
  Webhook- und Deck-Pfad müssen dieselbe verwenden, sonst legt der eine Kommentare an, die der
  andere nicht findet. Bei GitLab heißt das: `GITLAB_PROJECT_PATH` als **Pfad** setzen, nicht als
  numerische Projekt-ID, sonst weichen die beiden Quellen voneinander ab.
