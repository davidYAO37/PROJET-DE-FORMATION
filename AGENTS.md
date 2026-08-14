# Notes projet — Easy Medical

## Vérification type-check / build

```powershell
# TypeScript ciblé
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --project tsconfig.check.json --noEmit

# Build complet
$env:NODE_OPTIONS="--max-old-space-size=8192"
node ./node_modules/next/dist/bin/next build
```

## Licence / modules

- Les modules activables par licence sont définis dans `lib/licenceModules.ts`.
- La logique métier (alertes, signature, activation) est dans `lib/licence.ts` et `lib/licenceService.ts`.
- L'accès aux modules se vérifie côté API via `lib/moduleAccess.ts` et côté front via `components/licence/LicenceModuleGuard.tsx`.
- L'état de la licence d'un tenant est exposé par `GET /api/licence/status`.
- La gestion admin se trouve dans `/dashboard/parametres/licences`.
- La page "Ma licence" du tenant est `/dashboard/licence`.

## Initialisation des plans de licence

Après déploiement, un super-admin doit appeler :

```http
POST /api/licence/init-plans
```

Cela crée les plans par défaut (`trial`, `annual`, `custom`).

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner au minimum :

- `MONGODB_URI`
- `JWT_SECRET`
- `LICENCE_SECRET`

L'intégration Wave (optionnelle) nécessite :

- `WAVE_API_KEY`
- `WAVE_WEBHOOK_SECRET`
- `WAVE_API_URL`
- `WAVE_CALLBACK_URL`
- `NEXT_PUBLIC_BASE_URL`

En l'absence de clés Wave, les commandes sont créées en mode manuel et doivent être validées par un super-admin.

## Intégration Wave

Le fichier `lib/wave.ts` expose 3 fonctions :

- `createWaveCheckout(input)` : crée un paiement Wave et retourne l'URL de paiement.
- `verifyWaveTransaction(id)` : vérifie le statut d'une transaction auprès de Wave.
- `verifyWaveWebhookSignature(payload, signature)` : valide l'authenticité d'un webhook Wave.

### Flow Wave

```
Client crée une commande (POST /api/licence/orders)
        ↓
Serveur appelle createWaveCheckout()
        ↓
Redirection du client vers l'URL Wave
        ↓
Client paie sur son téléphone
        ↓
Wave redirige vers /api/licence/payment-callback?orderId=...&transactionId=...
        ↓
Webhook Wave → POST /api/webhooks/wave
        ↓
Commande passe à paid_awaiting_validation
        ↓
Super-admin valide la commande (POST /api/licence/orders/[id]/validate)
        ↓
Licence activée / renouvelée
```

### Adapter lib/wave.ts à la vraie API

Quand tu reçois la documentation officielle de Wave, mets à jour dans `lib/wave.ts` :

1. `WAVE_API_URL` : URL de l'API (sandbox puis production).
2. Endpoint de création : remplace `/checkout` par le vrai endpoint.
3. Body de la requête : adapte les champs (`client_reference`, `payment_reason`, `success_url`, etc.).
4. Réponse : remplace `data.id`, `data.checkout_id`, `data.wave_url` par les vrais champs.
5. Endpoint de vérification : remplace `/transactions/${transactionId}` par le vrai endpoint.
6. Signature webhook : implémente l'algorithme exact (HMAC-SHA256 ou autre).

### Variables Wave

```env
WAVE_API_KEY=ta_cle_api_wave
WAVE_WEBHOOK_SECRET=secret_pour_verifier_les_webhooks
WAVE_API_URL=https://api.wave.com/v1
WAVE_CALLBACK_URL=https://ton-domaine.com/api/licence/payment-callback
NEXT_PUBLIC_BASE_URL=https://ton-domaine.com
```

## Simulateur Wave (mode test sans clé API)

Si `WAVE_API_KEY` n'est pas défini, le système bascule automatiquement sur un simulateur local.

### Flow du simulateur

```
Client crée une commande avec paymentMethod="wave"
        ↓
createWaveCheckout retourne une URL locale /licence/wave-simulator?orderId=...
        ↓
Le client voit une page de simulation "Payer par Wave"
        ↓
Il clique sur "Simuler un paiement réussi"
        ↓
POST /api/licence/simulate-wave-payment met la commande à paid_awaiting_validation
        ↓
Redirection vers /api/licence/payment-callback?orderId=...&transactionId=...
        ↓
Le super-admin peut valider la commande
```

### Utilisation

1. Crée une commande depuis `/dashboard/licence`.
2. Choisis le mode de paiement "Wave".
3. Tu es redirigé vers le simulateur.
4. Clique sur "Payer" pour simuler un succès, ou "Échouer" pour un échec.
5. Retourne dans **Gestion licences → Commandes à valider** et valide la commande.

Le simulateur ne nécessite aucune clé Wave et permet de tester le flux complet.
