# ADR-001: Hexagonale Architektur (Ports & Adapters)

**Status:** Accepted
**Datum:** 2026-05-28

## Kontext

DARE ist eine Event-getriebene Anwendung, die Webhook-Events von externen Plattformen (GitHub, GitLab, Jira) empfängt und darauf mit Domain-Logik reagiert (Framework-Aktivierung, Work-Item-Reminders). Die Architektur muss:

- Domain-Logik unabhängig von HTTP-Framework und Persistenz testbar machen
- Austauschbare Adapter für verschiedene Plattformen ermöglichen
- Klare Abhängigkeitsrichtung einhalten (außen → innen)

## Entscheidung

Wir verwenden eine hexagonale Architektur mit drei Schichten:

```
src/
├── domain/
│   ├── model/          ← Entities (Installation)
│   ├── ports/
│   │   ├── inbound/    ← Interfaces die Domain-Services implementieren
│   │   └── outbound/   ← Interfaces die Adapter implementieren
│   └── services/       ← Business-Logik
├── adapters/
│   ├── inbound/        ← HTTP, Webhooks (treiben die Domain)
│   └── outbound/       ← Persistenz, Notification (werden von Domain genutzt)
```

### Ports (Interfaces)

- **Inbound Ports** (`IWorkflowEventPort`, `IHealthPort`): Definieren, was die Domain anbietet. Inbound-Adapter rufen diese auf.
- **Outbound Ports** (`ITeamNotificationPort`, `IInstallationRepository`): Definieren, was die Domain benötigt. Outbound-Adapter implementieren diese.

### Dependency Injection

Services erhalten ihre Abhängigkeiten via Constructor Injection. Die Verdrahtung erfolgt zentral in `app.ts`:

```typescript
const activationService = new FrameworkActivationService(notificationAdapter, installationRepo);
const reminderService   = new WorkItemReminderService(notificationAdapter);
```

Kein DI-Container — die manuelle Verdrahtung ist bei der aktuellen Projektgröße ausreichend und explizit nachvollziehbar.

### Bridge-Pattern für Inbound Ports

Da Services nicht direkt `IWorkflowEventPort` implementieren, wird in `app.ts` ein Bridge-Objekt erstellt, das Events auf Service-Methoden mappt:

```typescript
const workflowEventPort = {
  onFrameworkActivated: (i) => activationService.activate(i),
  onWorkItemOpened:     (i, id) => reminderService.remindOnWorkItemOpened(i, id),
};
```

## Konsequenzen

- **Positiv:** Domain-Services sind vollständig isoliert testbar (nur Mock-Ports nötig)
- **Positiv:** Adapter können unabhängig ausgetauscht werden (z.B. InMemory → PostgreSQL)
- **Positiv:** Klare Abhängigkeitsrichtung verhindert ungewollte Kopplungen
- **Trade-off:** Mehr Dateien und Indirektion als bei einem Flat-Layout
- **Trade-off:** Bridge-Pattern in `app.ts` erfordert manuelles Mapping bei neuen Events
