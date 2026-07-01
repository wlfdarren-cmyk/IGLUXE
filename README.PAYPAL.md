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
