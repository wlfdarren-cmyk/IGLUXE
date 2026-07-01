Guide rapide — intégration PayPal (tests)

1) Lancer le serveur local pour enregistrer les commandes (démo):

```bash
cd /workspaces/IGLUXE
npm install
npm start
```

Le serveur écoute par défaut sur `http://localhost:3000` et expose `POST /api/orders` et `GET /api/orders`.

2) Mode SDK PayPal actuellement configuré pour `sandbox` (tests). Pour passer en production, remplacez la balise SDK dans `index.html` :

```html
<script src="https://www.paypal.com/sdk/js?client-id=VOTRE_CLIENT_ID&currency=EUR"></script>
```

Remplacez `VOTRE_CLIENT_ID` par votre identifiant Live (ou sandbox pour tests).

3) Webhooks et sécurité :
- Si vous automatisez la réconciliation, configurez des webhooks PayPal et vérifiez la validité des notifications côté serveur.
- Ce dépôt fournit seulement un stockage local JSON pour la démonstration. En production, utilisez une base de données et vérifiez les signatures PayPal.

4) Déploiement backend recommandé
- Ce dépôt contient `server.js` (Express) pour recevoir les commandes et les webhooks PayPal. Avant de déployer, créez un service (Render, Railway, Heroku) et définissez les variables d'environnement indiquées dans `.env.example`.

Render (rapide) :
- Créez un nouveau Web Service, connectez votre dépôt GitHub `wlfdarren-cmyk/IGLUXE` et choisissez la branche `main`.
- Commande de build : none (utilise `package.json`); Port : `3000`.
- Ajoutez les variables : `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE=live`.

Heroku :
```bash
heroku create your-app-name
git push heroku main
heroku config:set PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... PAYPAL_WEBHOOK_ID=... PAYPAL_MODE=live
```

Après déploiement, enregistrez l'URL publique du service (ex : `https://igluxe-backend.onrender.com`) et configurez les webhooks PayPal pour pointer vers :

```
https://<votre-backend>/api/paypal-webhook
```

Événements recommandés à souscrire sur PayPal :
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `CHECKOUT.ORDER.APPROVED`

Note de sécurité : ne stockez pas les `PAYPAL_SECRET` dans le code source. Utilisez les variables d'environnement du service d'hébergement.
