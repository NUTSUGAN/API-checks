# API Checks

Scripts Node.js pour tester et comparer plusieurs providers IA / API :

* Mistral
* Groq
* Hugging Face
* Pinecone

Projet réalisé pour explorer :

* Vérification de connexions API
* Comparaison de providers LLM
* Latence / disponibilité
* Prompt engineering
* Estimation de coûts
* Effet de la température sur les réponses

---

## Installation

```bash
npm install
```

---

## Variables d'environnement

Créer un fichier `.env` :

```env
MISTRAL_API_KEY=your_key
GROQ_API_KEY=your_key
HUGGING_FACE_API_KEY=your_key
PINECONE_API_KEY=your_key
```

---

## Scripts disponibles

### 1. Vérification des connexions API

```bash
node check-connexion.js
```

Mode verbose :

```bash
node check-connexion.js --verbose
```

Fonctionnalités :

* Vérifie la disponibilité des APIs
* Mesure la latence
* Affiche un résumé formaté
* Teste Pinecone en GET

---

### 2. Cost Calculator

```bash
node cost-calculator.js
```

Fonctionnalités :

* Estimation approximative des tokens
* Calcul du coût input par provider
* Projection pour 1000 requêtes

---

### 3. Prompt Lab

```bash
node prompt-lab.js
```

Fonctionnalités :

* Compare 3 providers
* Teste 3 températures différentes
* Lance 9 requêtes en parallèle
* Observe l'effet de la température sur le ton des réponses

---

## Structure du projet

```txt
.
├── check-connexion.js
├── cost-calculator.js
├── prompt-lab.js
├── package.json
├── .env
└── README.md
```

---

## Concepts travaillés

* Async / Await
* Promise.all
* Variables d’environnement avec dotenv
* Appels HTTP avec fetch
* Gestion d’erreurs API
* Prompt Engineering
* Coût / Tokens estimation
* Multi-provider architecture

---

## Notes

* Hugging Face utilise le router OpenAI-compatible :
  `https://router.huggingface.co/v1/chat/completions`
* Pinecone est vérifié via :
  `GET https://api.pinecone.io/indexes`

---

## Auteur

Projet réalisé dans le cadre d’un apprentissage sur les APIs IA / LLM.
