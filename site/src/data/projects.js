// Puli's projects, shortened from the old page's Selected Work cards (index.html). Copy gets its final edit in the review.
// status: 'building' = in progress (shown with a red dot), otherwise finished. figure: name of an animated figure in
// src/figures/ shown at the top of the card.
export const PROJECTS = [
  {
    status: 'building', tag: "In progress · Bachelor's thesis",
    figure: 'thesis', // an animated Anatomy figure on the card (src/figures/)
    title: 'Self-optimising code vulnerability detection',
    text: 'A fine-tuned transformer that flags vulnerable functions, wrapped in a loop of three AI agents that train it, test it and debate the next configuration. Benchmarked against Optuna.',
    chips: ['PyTorch', 'CodeBERT', 'Multi-agent AI', 'Optuna'],
  },
  {
    status: 'building', tag: 'In progress · Software engineering',
    title: 'Project Artha: autonomous trading system',
    text: 'A research trading system that forecasts market direction and puts loss minimisation first, with a risk layer that cuts losses fast and a live monitoring dashboard.',
    chips: ['Python', 'Machine learning', 'Risk management'],
  },
  {
    tag: 'Security · 2026',
    title: 'DEICMS: Digital Evidence & Integrity Management',
    text: 'A digital-forensics platform with a graph-based chain-of-custody engine that cryptographically verifies every evidence item and detects tampering.',
    chips: ['Flask', 'Applied cryptography', 'Scikit-learn'],
  },
  {
    tag: 'Databases · 2025',
    title: 'SQL vs NoSQL performance benchmark',
    text: 'MySQL, MongoDB, Cassandra, Redis and Neo4j benchmarked on the same one-million-record dataset: execution time, scalability and storage.',
    chips: ['Python', 'NoSQL', 'Docker'],
  },
  {
    tag: 'Full stack · 2025',
    title: "Papa's Pizzeria: full-stack ordering platform",
    text: 'A PHP/MySQL ordering and management system with customer and admin roles, cart and order tracking, and inventory.',
    chips: ['PHP', 'MySQL', 'JavaScript', 'Docker'],
  },
  {
    tag: 'Machine learning · 2024',
    title: 'Customer churn prediction',
    text: 'Four classifiers compared with tuning and cross-validation, plus K-Means customer segmentation, evaluated on ROC-AUC, precision, recall and F1.',
    chips: ['Scikit-learn', 'Pandas'],
  },
  {
    tag: 'Data mining · 2024',
    title: 'Emotion classification from physiological signals',
    text: 'A data-mining pipeline for psychophysiological data: feature selection, dimensionality reduction and a cross-validated comparison of classifiers.',
    chips: ['Python', 'Feature engineering'],
  },
  {
    tag: 'Job simulation · Mastercard · 2025',
    title: 'Phishing threat analysis',
    text: 'Triaged phishing emails with the SLAM framework and wrote security-awareness training on spoofed senders and urgency cues.',
    chips: ['Email forensics', 'Social engineering'],
  },
];
