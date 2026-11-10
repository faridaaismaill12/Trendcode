// =============================================================
// Trendcode — site content data
// Everything the homepage, search, labs and progress tracker show
// comes from here. Add a post / lab / term and it appears everywhere.
// =============================================================

// Topic key → label, blurb and a 24x24 stroke icon (SVG path data).
const TOPICS = {
  pqc: {
    label: "Post-Quantum",
    blurb: "Why today's encryption is at risk, and the new algorithms built to replace it.",
    icon: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5zM12 15v2",
  },
  ai: {
    label: "AI Security",
    blurb: "Prompt injection, model risk, and how to deploy AI safely.",
    icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4",
  },
  quantum: {
    label: "Quantum Computing",
    blurb: "Qubits, superposition and what quantum machines can really do today.",
    icon: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M3 12c0-2.5 4-4.5 9-4.5s9 2 9 4.5-4 4.5-9 4.5-9-2-9-4.5zM7.5 4.2c2.2-1.2 6.2 1.5 9 6.2s3.4 8.4 1.2 9.6",
  },
  crypto: {
    label: "Cryptography Basics",
    blurb: "Hashes, keys and ciphers: the building blocks behind every secure app.",
    icon: "M8 15a4 4 0 1 1 3.5-6H21v3h-2v3h-3v-3h-4.5A4 4 0 0 1 8 15z",
  },
  ml: {
    label: "Machine Learning",
    blurb: "How models learn from data, and why they sometimes learn the wrong thing.",
    icon: "M5 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 6.5l10 5M7 17.5l10-5",
  },
  websec: {
    label: "Web Security",
    blurb: "Passwords, passkeys and the attacks every web developer should know.",
    icon: "M3 5h18v14H3zM3 9h18M7 14h4M14 14h3",
  },
  algo: {
    label: "Algorithms",
    blurb: "Big-O, sorting and the ideas that make code fast or painfully slow.",
    icon: "M4 20V14M9 20V9M14 20V12M19 20V4",
  },
  systems: {
    label: "Systems & Cloud",
    blurb: "Networks, servers and what really happens between click and page.",
    icon: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
  },
  privacy: {
    label: "Privacy & Data",
    blurb: "Learning from data without exposing the people inside it.",
    icon: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M4 4l16 16",
  },
  emerging: {
    label: "Emerging Tech",
    blurb: "The next wave, from WebAssembly to new programming paradigms.",
    icon: "M13 2L4 14h7l-1 8 9-12h-7z",
  },
};

// Posts — newest first. `lab` links a post to its hands-on lab.
const posts = [
  {
    slug: "how-neural-networks-learn",
    title: "How neural networks learn (gradient descent without the calculus)",
    excerpt: "A model is a pile of dials. Training is the art of turning them, a little at a time, in the right direction.",
    date: "2026-11-11", topic: "ml", readTime: 7, lab: "perceptron-playground",
  },
  {
    slug: "hashing-explained",
    title: "Hashing, explained: the fingerprint of data",
    excerpt: "One function quietly protects your passwords, your downloads and every blockchain. Here's how it works.",
    date: "2026-11-11", topic: "crypto", readTime: 6, lab: "hash-lab",
  },
  {
    slug: "how-passkeys-work",
    title: "Passwords are dying. Here's how passkeys replace them.",
    excerpt: "Passkeys use public-key cryptography so there's no secret for a phishing site to steal.",
    date: "2026-11-11", topic: "websec", readTime: 6, lab: "password-lab",
  },
  {
    slug: "big-o-notation",
    title: "Big-O notation: why some code gets slow",
    excerpt: "Your code works on 100 items. Will it work on 10 million? Big-O is how you find out before your users do.",
    date: "2026-11-11", topic: "algo", readTime: 6, lab: "sorting-visualizer",
  },
  {
    slug: "what-happens-when-you-type-a-url",
    title: "What actually happens when you type a URL and press Enter",
    excerpt: "DNS, TCP, TLS, HTTP and a rendering engine, all in a few hundred milliseconds.",
    date: "2026-11-11", topic: "systems", readTime: 7,
  },
  {
    slug: "differential-privacy",
    title: "Differential privacy: learning from data without learning about you",
    excerpt: "How adding carefully measured noise lets census bureaus and tech companies publish statistics safely.",
    date: "2026-11-11", topic: "privacy", readTime: 6,
  },
  {
    slug: "prompt-injection-explained",
    title: "Prompt injection, explained: when an AI can't tell data from orders",
    excerpt: "Why language models can be talked into ignoring their instructions, and the defenses that actually help.",
    date: "2026-11-10", topic: "ai", readTime: 7, lab: "injection-lab",
  },
  {
    slug: "qubits-without-the-mysticism",
    title: "Qubits without the mysticism: what a quantum computer actually does",
    excerpt: "Superposition, entanglement and interference in plain words, plus how to read quantum headlines.",
    date: "2026-11-10", topic: "quantum", readTime: 7, lab: "qubit-playground",
  },
  {
    slug: "webassembly-beyond-the-browser",
    title: "WebAssembly is leaving the browser. Here's why that matters.",
    excerpt: "A small, fast, sandboxed unit of code is turning up in servers, edge networks and plugin systems.",
    date: "2026-11-10", topic: "emerging", readTime: 6,
  },
  {
    slug: "what-is-post-quantum-cryptography",
    title: "What is Post-Quantum Cryptography (and why should you care)?",
    excerpt: "The quantum threat to today's encryption, harvest-now-decrypt-later, and the new NIST standards.",
    date: "2026-11-09", topic: "pqc", readTime: 6, lab: "cipher-lab",
  },
];

// Hands-on labs. Each one lives at labs/<slug>.html.
const labs = [
  {
    slug: "cipher-lab", title: "Crack the Cipher", topic: "crypto", level: "Beginner", minutes: 10,
    blurb: "Encrypt with a Caesar cipher, then break one using frequency analysis, the trick that beat ciphers for 1,000 years.",
  },
  {
    slug: "hash-lab", title: "Hash Avalanche & Mining", topic: "crypto", level: "Beginner", minutes: 10,
    blurb: "Change one letter and watch half the bits of a SHA-256 hash flip. Then mine a hash that starts with zeros.",
  },
  {
    slug: "qubit-playground", title: "Qubit Playground", topic: "quantum", level: "Intermediate", minutes: 15,
    blurb: "Apply real quantum gates to a simulated qubit, watch amplitudes interfere and solve three circuit puzzles.",
  },
  {
    slug: "injection-lab", title: "Prompt Injection Lab", topic: "ai", level: "Beginner", minutes: 12,
    blurb: "Spot hidden attacks in emails and web pages, then toggle defenses on a simulated AI agent to see which ones hold.",
  },
  {
    slug: "sorting-visualizer", title: "Sorting Race", topic: "algo", level: "Beginner", minutes: 10,
    blurb: "Watch bubble, insertion, merge and quick sort work step by step, and count how many comparisons each one needs.",
  },
  {
    slug: "perceptron-playground", title: "Train a Neuron", topic: "ml", level: "Intermediate", minutes: 15,
    blurb: "Drop points on a canvas and watch a single neuron learn to separate them with gradient descent. Then try to break it.",
  },
  {
    slug: "password-lab", title: "Password Cracking Clock", topic: "websec", level: "Beginner", minutes: 8,
    blurb: "See how long a password survives an offline attack, and generate a passphrase that's strong and memorable.",
  },
];

// Learning paths: ordered steps that mix reading and doing.
const paths = [
  {
    id: "security", title: "Security foundations", color: "accent",
    blurb: "From hashes to passkeys to AI attacks: how modern systems protect secrets.",
    steps: [
      ["post", "hashing-explained"], ["lab", "hash-lab"], ["post", "how-passkeys-work"],
      ["lab", "password-lab"], ["post", "prompt-injection-explained"], ["lab", "injection-lab"],
    ],
  },
  {
    id: "quantum", title: "Quantum & the future of crypto", color: "accent-2",
    blurb: "Understand qubits, then why they force the biggest cryptography upgrade in history.",
    steps: [
      ["lab", "cipher-lab"], ["post", "qubits-without-the-mysticism"], ["lab", "qubit-playground"],
      ["post", "what-is-post-quantum-cryptography"],
    ],
  },
  {
    id: "ai", title: "How AI works (and breaks)", color: "good",
    blurb: "Train a neuron by hand, then learn how AI systems get attacked and how data stays private.",
    steps: [
      ["post", "how-neural-networks-learn"], ["lab", "perceptron-playground"],
      ["post", "prompt-injection-explained"], ["lab", "injection-lab"], ["post", "differential-privacy"],
    ],
  },
  {
    id: "cs", title: "Think like a computer scientist", color: "warn",
    blurb: "Complexity, sorting and the journey of a web request: core ideas every developer uses daily.",
    steps: [
      ["post", "big-o-notation"], ["lab", "sorting-visualizer"],
      ["post", "what-happens-when-you-type-a-url"], ["post", "webassembly-beyond-the-browser"],
    ],
  },
];

// Glossary: [term, topic, definition]
const glossary = [
  ["Agent", "ai", "An AI system that can take actions, like browsing, running code or sending email, rather than only producing text."],
  ["Avalanche effect", "crypto", "A property of good hash functions: changing a single bit of input flips about half the bits of the output."],
  ["Big-O notation", "algo", "A way to describe how an algorithm's running time or memory grows as the input gets larger, ignoring constant factors."],
  ["Caesar cipher", "crypto", "One of the oldest ciphers: shift every letter by a fixed amount. Trivial to break with frequency analysis."],
  ["CDN", "systems", "Content Delivery Network: servers spread around the world that keep copies of content close to users to cut latency."],
  ["Component Model", "emerging", "A WebAssembly standard that lets modules written in different languages describe their interfaces and plug into each other."],
  ["Crypto-agility", "pqc", "Designing systems so cryptographic algorithms can be swapped without rebuilding everything. Essential for the post-quantum migration."],
  ["Decoherence", "quantum", "When a qubit's fragile quantum state is disturbed by its environment, introducing errors into the computation."],
  ["Differential privacy", "privacy", "A mathematical guarantee that the result of an analysis barely changes whether or not any single person's data is included."],
  ["DNS", "systems", "The Domain Name System: the internet's phone book that turns names like example.com into IP addresses."],
  ["Entanglement", "quantum", "A link between qubits that makes their measurement outcomes correlated in ways independent bits can't reproduce."],
  ["Entropy (passwords)", "websec", "A measure of how unpredictable a password is, in bits. Each extra bit doubles the number of guesses an attacker needs."],
  ["Epsilon (ε)", "privacy", "The privacy budget in differential privacy. Smaller ε means more noise and stronger privacy, at the cost of accuracy."],
  ["Frequency analysis", "crypto", "Breaking substitution ciphers by counting letters: in English, E, T and A are the most common, and the ciphertext gives that away."],
  ["Gradient descent", "ml", "The training method behind most machine learning: repeatedly nudge every parameter slightly in the direction that reduces the error."],
  ["Grover's algorithm", "quantum", "A quantum search algorithm with a quadratic speed-up. It weakens symmetric keys somewhat, which is why AES-256 is recommended."],
  ["Harvest now, decrypt later", "pqc", "Collecting encrypted data today in order to decrypt it once a capable quantum computer exists."],
  ["Hash function", "crypto", "A function that turns any input into a fixed-size fingerprint. Easy to compute, practically impossible to reverse."],
  ["Hybrid mode", "pqc", "Combining a classical algorithm with a post-quantum one, so a connection stays secure as long as either one holds."],
  ["Jailbreak", "ai", "A direct attempt by a user to talk a model out of its safety rules, often through role-play or clever framing."],
  ["Lattice cryptography", "pqc", "Cryptography based on hard problems involving grids of points in many dimensions. The basis of ML-KEM and ML-DSA."],
  ["Learning rate", "ml", "How big a step gradient descent takes each update. Too small and training crawls; too big and it overshoots and diverges."],
  ["Logical qubit", "quantum", "A reliable qubit built from many noisy physical qubits using error correction."],
  ["ML-DSA", "pqc", "Module-Lattice Digital Signature Algorithm (FIPS 204), formerly Dilithium. The main post-quantum signature standard."],
  ["ML-KEM", "pqc", "Module-Lattice Key-Encapsulation Mechanism (FIPS 203), formerly Kyber. The main post-quantum standard for exchanging keys."],
  ["Overfitting", "ml", "When a model memorizes its training data, noise included, and then performs badly on new data."],
  ["Passkey", "websec", "A phishing-resistant replacement for passwords: a key pair where the private key never leaves your device."],
  ["Perceptron", "ml", "The simplest artificial neuron: a weighted sum of inputs followed by a threshold. It can only separate data with a straight line."],
  ["Phishing", "websec", "Tricking someone into handing over credentials on a fake site or message that imitates a real one."],
  ["Prompt injection", "ai", "Getting a language model to follow attacker-written instructions by placing them in text the model processes."],
  ["Public-key cryptography", "crypto", "Cryptography with a key pair: a public key anyone can use to encrypt or verify, and a private key only the owner holds."],
  ["Qubit", "quantum", "The basic unit of quantum information, described by amplitudes for 0 and 1 and read out as a single classical bit."],
  ["Salt", "websec", "Random data added to each password before hashing, so identical passwords produce different hashes and precomputed tables fail."],
  ["Sandbox", "emerging", "An isolated environment where code runs with only the permissions it has been explicitly given."],
  ["Shor's algorithm", "quantum", "A quantum algorithm that factors large numbers efficiently, threatening RSA, ECC and Diffie-Hellman."],
  ["Superposition", "quantum", "A qubit state where the amplitudes for both 0 and 1 matter during computation, until measurement."],
  ["TCP", "systems", "Transmission Control Protocol: delivers a reliable, ordered stream of bytes over the unreliable internet."],
  ["TLS", "systems", "Transport Layer Security: the protocol behind the padlock in your browser, encrypting and authenticating web traffic."],
  ["WASI", "emerging", "The WebAssembly System Interface: standard APIs that let Wasm modules use files, clocks and sockets outside a browser."],
  ["WebAssembly (Wasm)", "emerging", "A portable, fast, sandboxed binary format that many languages compile to, running in browsers and beyond."],
];

// Quiz pool: each round draws 5 at random.
const quizPool = [
  {
    q: "What does \"harvest now, decrypt later\" describe?",
    options: ["Mining cryptocurrency during off-peak hours", "Stealing encrypted data today to unlock it once quantum computers can", "Backing up keys before rotating them", "Training AI models on scraped data"],
    a: 1, why: "Attackers can store encrypted traffic now and wait. Data that must stay secret for years is already at risk.", post: "what-is-post-quantum-cryptography",
  },
  {
    q: "Which NIST standard is used for exchanging keys?",
    options: ["ML-DSA (FIPS 204)", "SLH-DSA (FIPS 205)", "ML-KEM (FIPS 203)", "SHA-3 (FIPS 202)"],
    a: 2, why: "ML-KEM is the key-encapsulation mechanism. ML-DSA and SLH-DSA are for digital signatures.", post: "what-is-post-quantum-cryptography",
  },
  {
    q: "Why is indirect prompt injection especially dangerous?",
    options: ["It only works on very old models", "It requires physical access to the server", "The attacker hides instructions in content the AI reads later, so the user did nothing wrong", "It makes models respond more slowly"],
    a: 2, why: "The malicious text lives in a web page, email or document. The victim is the innocent user whose assistant reads it.", post: "prompt-injection-explained",
  },
  {
    q: "What is the real source of a quantum computer's speed-up?",
    options: ["It literally tries every answer and reports them all", "Interference that cancels wrong answers and reinforces right ones", "Faster clock speeds than classical chips", "Storing more data per transistor"],
    a: 1, why: "Measuring gives you just one result, so algorithms are choreographed so wrong answers' amplitudes cancel out.", post: "qubits-without-the-mysticism",
  },
  {
    q: "What can a WebAssembly module access by default?",
    options: ["Only its own memory, nothing else unless the host grants it", "The full file system", "The network, but not files", "Everything the browser can access"],
    a: 0, why: "Wasm is deny-by-default: files, clocks and sockets must be explicitly handed over, for example through WASI.", post: "webassembly-beyond-the-browser",
  },
  {
    q: "You change one letter of a document. What happens to its SHA-256 hash?",
    options: ["One character of the hash changes", "Nothing, hashes ignore small changes", "About half of the 256 bits flip, so it looks completely different", "The hash gets longer"],
    a: 2, why: "That's the avalanche effect. It's why a hash works as a tamper-evident fingerprint.", post: "hashing-explained",
  },
  {
    q: "Why can't a phishing site steal your passkey?",
    options: ["Passkeys are longer than passwords", "The private key never leaves your device and is bound to the real site's domain", "Passkeys expire every 24 hours", "Browsers block all phishing sites"],
    a: 1, why: "Your device only signs challenges for the domain the passkey was created for, and it never sends the private key anywhere.", post: "how-passkeys-work",
  },
  {
    q: "An O(n²) algorithm takes 1 second on 1,000 items. Roughly how long on 10,000?",
    options: ["10 seconds", "100 seconds", "2 seconds", "1,000 seconds"],
    a: 1, why: "10× the input means 10² = 100× the work for a quadratic algorithm.", post: "big-o-notation",
  },
  {
    q: "What does gradient descent do during training?",
    options: ["Deletes the worst training examples", "Nudges every parameter slightly in the direction that lowers the error", "Picks random weights until one works", "Sorts the data by difficulty"],
    a: 1, why: "It measures which way each dial should turn to reduce the loss, then takes a small step that way, millions of times.", post: "how-neural-networks-learn",
  },
  {
    q: "What is the first network step when you type a new domain into a browser?",
    options: ["A TLS handshake", "A DNS lookup to find the server's IP address", "Downloading the page's JavaScript", "Opening a WebSocket"],
    a: 1, why: "Before it can connect anywhere, the browser has to turn the name into an address.", post: "what-happens-when-you-type-a-url",
  },
  {
    q: "In differential privacy, what does a smaller epsilon (ε) mean?",
    options: ["Faster queries", "Less noise and weaker privacy", "More noise and stronger privacy", "Fewer people in the dataset"],
    a: 2, why: "ε is the privacy budget. Shrinking it adds more noise so no individual can be singled out.", post: "differential-privacy",
  },
];
