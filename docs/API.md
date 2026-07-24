# API Smiris Learn

Les endpoints sont des Supabase Edge Functions. Chaque requete doit fournir une cle API active dans l'en-tete `X-API-Key`.

Base URL : `https://frftiwiqqehyiyjybemx.supabase.co/functions/v1`

## Authentification

```http
X-API-Key: sm_live_votre_cle
Content-Type: application/json
```

Les cles sont creees dans l'espace super-admin et ne sont affichees qu'une seule fois. Ne les placez jamais dans une application navigateur publique.

## Endpoints disponibles

| Methode | Endpoint | Acces |
| --- | --- | --- |
| GET | `/list-students/{organizationId}?page=1&limit=20&search=...` | Cle de l'organisation ou super-admin |
| POST | `/add-student/organizations/{organizationId}/students` | Cle de l'organisation ou super-admin |
| PATCH | `/update-student/{studentId}` | Cle de l'organisation ou super-admin |
| DELETE | `/delete-student/{studentId}` | Cle de l'organisation ou super-admin |
| POST | `/assign-groups` | Cle de l'organisation ou super-admin |
| POST | `/create-account` | Super-admin uniquement |
| GET | `/list-accounts?page=1&limit=20` | Super-admin uniquement |
| POST | `/suspend-account/{userId}` | Cle de l'organisation ou super-admin |
| DELETE | `/delete-account/{userId}` | Cle de l'organisation ou super-admin |

## Exemple

```bash
curl "https://frftiwiqqehyiyjybemx.supabase.co/functions/v1/list-students/ORGANIZATION_ID?page=1&limit=20" \
  -H "X-API-Key: sm_live_votre_cle"
```

Les reponses utilisent le format `{ "success": true, "data": ... }`. Les listes ajoutent un objet `pagination`.

Les appels de paiement (`create-checkout-session`, `create-portal-session`) utilisent la session Supabase de l'utilisateur, pas une cle API externe. Le webhook Stripe est appele uniquement par Stripe.

## Script de verification

Le script PowerShell reutilisable [test-api.ps1](../scripts/test-api.ps1) ne contient aucune cle. Il teste seulement la lecture par defaut :

```powershell
.\scripts\test-api.ps1
```

Pour executer le cycle complet de creation, lecture, modification et suppression de donnees temporaires :

```powershell
.\scripts\test-api.ps1 -RunWriteTests -Cleanup
```

Vous pouvez aussi fournir la cle par variable d'environnement temporaire :

```powershell
$env:SMIRIS_API_KEY = Read-Host "API key"
.\scripts\test-api.ps1 -RunWriteTests -Cleanup
Remove-Item Env:SMIRIS_API_KEY
```
