// scripts/seed-comprehensive-resources.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore(app);

// Comprehensive book recommendations
const books = [
  // Introduction to Computer Science
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'book',
    resource_title: 'Computer Science: An Overview',
    resource_url: 'https://www.pearson.com/us/higher-education/program/Brookshear-Computer-Science-An-Overview-13th-Edition/PGM1743309.html',
    resource_author: 'J. Glenn Brookshear',
    difficulty_level: 1,
    topic_tags: ['Computer Science Fundamentals', 'Overview', 'Introduction'],
    rating: 4.3,
    estimated_hours: 30,
    description: 'Comprehensive overview of computer science fundamentals',
    is_free: false
  },
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'book',
    resource_title: 'How to Think Like a Computer Scientist',
    resource_url: 'https://greenteapress.com/wp/think-python-2e/',
    resource_author: 'Allen B. Downey',
    difficulty_level: 1,
    topic_tags: ['Programming Logic', 'Problem Solving', 'Python'],
    rating: 4.5,
    estimated_hours: 25,
    description: 'Learn computational thinking and programming fundamentals',
    is_free: true
  },
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'book',
    resource_title: 'Code: The Hidden Language of Computer Hardware and Software',
    resource_url: 'https://www.microsoftpressstore.com/store/code-the-hidden-language-of-computer-hardware-and-9780735611313',
    resource_author: 'Charles Petzold',
    difficulty_level: 2,
    topic_tags: ['Computer Architecture', 'Hardware', 'Software'],
    rating: 4.6,
    estimated_hours: 35,
    description: 'Understanding how computers work from the ground up',
    is_free: false
  },

  // Mathematics for Computing
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'book',
    resource_title: 'Discrete Mathematics and Its Applications',
    resource_url: 'https://www.mheducation.com/highered/product/discrete-mathematics-applications-rosen/M9781259676512.html',
    resource_author: 'Kenneth H. Rosen',
    difficulty_level: 3,
    topic_tags: ['Discrete Mathematics', 'Logic', 'Set Theory'],
    rating: 4.4,
    estimated_hours: 50,
    description: 'Comprehensive discrete mathematics for computer science',
    is_free: false
  },
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'book',
    resource_title: 'Concrete Mathematics: A Foundation for Computer Science',
    resource_url: 'https://www.pearson.com/us/higher-education/program/Graham-Concrete-Mathematics-A-Foundation-for-Computer-Science-2nd-Edition/PGM54285.html',
    resource_author: 'Graham, Knuth, and Patashnik',
    difficulty_level: 4,
    topic_tags: ['Advanced Mathematics', 'Algorithms', 'Mathematical Analysis'],
    rating: 4.7,
    estimated_hours: 60,
    description: 'Advanced mathematical foundations for computer science',
    is_free: false
  },
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'book',
    resource_title: 'Essential Math for AI',
    resource_url: 'https://www.oreilly.com/library/view/essential-math-for/9781492077985/',
    resource_author: 'Hala Nelson',
    difficulty_level: 3,
    topic_tags: ['AI Mathematics', 'Linear Algebra', 'Statistics'],
    rating: 4.2,
    estimated_hours: 40,
    description: 'Mathematical foundations for artificial intelligence',
    is_free: false
  },

  // Programming Fundamentals
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'book',
    resource_title: 'Automate the Boring Stuff with Python',
    resource_url: 'https://automatetheboringstuff.com/',
    resource_author: 'Al Sweigart',
    difficulty_level: 1,
    topic_tags: ['Python', 'Automation', 'Beginner Programming'],
    rating: 4.6,
    estimated_hours: 30,
    description: 'Learn Python programming through practical automation projects',
    is_free: true
  },
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'book',
    resource_title: 'The Pragmatic Programmer',
    resource_url: 'https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/',
    resource_author: 'David Thomas and Andrew Hunt',
    difficulty_level: 2,
    topic_tags: ['Software Development', 'Best Practices', 'Programming Philosophy'],
    rating: 4.8,
    estimated_hours: 25,
    description: 'Essential practices for professional software development',
    is_free: false
  },
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'book',
    resource_title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    resource_url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/',
    resource_author: 'Robert C. Martin',
    difficulty_level: 2,
    topic_tags: ['Code Quality', 'Software Craftsmanship', 'Best Practices'],
    rating: 4.7,
    estimated_hours: 35,
    description: 'Writing clean, maintainable, and professional code',
    is_free: false
  },

  // Object-Oriented Programming (OOP)
  {
    module_name: 'Object-Oriented Programming (OOP)',
    resource_type: 'book',
    resource_title: 'Head First Design Patterns',
    resource_url: 'https://www.oreilly.com/library/view/head-first-design/0596007124/',
    resource_author: 'Eric Freeman & Elisabeth Robson',
    difficulty_level: 2,
    topic_tags: ['Design Patterns', 'OOP', 'Software Architecture'],
    rating: 4.5,
    estimated_hours: 40,
    description: 'Learn design patterns in an engaging, visual way',
    is_free: false
  },
  {
    module_name: 'Object-Oriented Programming (OOP)',
    resource_type: 'book',
    resource_title: 'Clean Architecture: A Craftsman\'s Guide to Software Structure and Design',
    resource_url: 'https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/',
    resource_author: 'Robert C. Martin',
    difficulty_level: 3,
    topic_tags: ['Software Architecture', 'Clean Code', 'System Design'],
    rating: 4.6,
    estimated_hours: 45,
    description: 'Principles of clean software architecture and design',
    is_free: false
  },

  // Computer Networks
  {
    module_name: 'Computer Networks',
    resource_type: 'book',
    resource_title: 'Computer Networking: A Top-Down Approach',
    resource_url: 'https://gaia.cs.umass.edu/kurose_ross/index.php',
    resource_author: 'Kurose and Ross',
    difficulty_level: 2,
    topic_tags: ['Networking', 'Protocols', 'Internet'],
    rating: 4.6,
    estimated_hours: 50,
    description: 'Comprehensive networking textbook with top-down approach',
    is_free: false
  },
  {
    module_name: 'Computer Networks',
    resource_type: 'book',
    resource_title: 'TCP/IP Illustrated, Vol. 1: The Protocols',
    resource_url: 'https://www.pearson.com/us/higher-education/program/Stevens-TCP-IP-Illustrated-Volume-1-The-Protocols-2nd-Edition/PGM319383.html',
    resource_author: 'W. Richard Stevens',
    difficulty_level: 3,
    topic_tags: ['TCP/IP', 'Network Protocols', 'Advanced Networking'],
    rating: 4.7,
    estimated_hours: 60,
    description: 'Deep dive into TCP/IP protocols and implementation',
    is_free: false
  },

  // Operating Systems
  {
    module_name: 'Operating Systems',
    resource_type: 'book',
    resource_title: 'Operating System Concepts',
    resource_url: 'https://www.wiley.com/en-us/Operating+System+Concepts%2C+10th+Edition-p-9781119320913',
    resource_author: 'Silberschatz, Galvin, and Gagne',
    difficulty_level: 3,
    topic_tags: ['Operating Systems', 'System Programming', 'Concurrency'],
    rating: 4.5,
    estimated_hours: 55,
    description: 'The classic "Dinosaur Book" for operating systems',
    is_free: false
  },
  {
    module_name: 'Operating Systems',
    resource_type: 'book',
    resource_title: 'Modern Operating Systems',
    resource_url: 'https://www.pearson.com/us/higher-education/program/Tanenbaum-Modern-Operating-Systems-4th-Edition/PGM80736.html',
    resource_author: 'Andrew S. Tanenbaum',
    difficulty_level: 3,
    topic_tags: ['Operating Systems', 'System Design', 'Computer Architecture'],
    rating: 4.4,
    estimated_hours: 50,
    description: 'Modern approach to operating system concepts and design',
    is_free: false
  },

  // Introduction to Machine Learning
  {
    module_name: 'Introduction to Machine Learning',
    resource_type: 'book',
    resource_title: 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow',
    resource_url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/',
    resource_author: 'Aurélien Géron',
    difficulty_level: 2,
    topic_tags: ['Machine Learning', 'Python', 'TensorFlow', 'Scikit-Learn'],
    rating: 4.8,
    estimated_hours: 60,
    description: 'Practical machine learning with popular Python libraries',
    is_free: false
  },
  {
    module_name: 'Introduction to Machine Learning',
    resource_type: 'book',
    resource_title: 'The Hundred-Page Machine Learning Book',
    resource_url: 'http://themlbook.com/',
    resource_author: 'Andriy Burkov',
    difficulty_level: 2,
    topic_tags: ['Machine Learning', 'Concise Guide', 'Theory'],
    rating: 4.6,
    estimated_hours: 20,
    description: 'Concise yet comprehensive introduction to machine learning',
    is_free: false
  },

  // Web Development
  {
    module_name: 'Web Development',
    resource_type: 'book',
    resource_title: 'Eloquent JavaScript',
    resource_url: 'https://eloquentjavascript.net/',
    resource_author: 'Marijn Haverbeke',
    difficulty_level: 2,
    topic_tags: ['JavaScript', 'Web Programming', 'Frontend'],
    rating: 4.5,
    estimated_hours: 40,
    description: 'Modern introduction to JavaScript programming',
    is_free: true
  },
  {
    module_name: 'Web Development',
    resource_type: 'book',
    resource_title: 'Don\'t Make Me Think, Revisited: A Common Sense Approach to Web Usability',
    resource_url: 'https://www.pearson.com/us/higher-education/program/Krug-Don-t-Make-Me-Think-Revisited-A-Common-Sense-Approach-to-Web-Usability-3rd-Edition/PGM24634.html',
    resource_author: 'Steve Krug',
    difficulty_level: 1,
    topic_tags: ['UX Design', 'Web Usability', 'User Interface'],
    rating: 4.7,
    estimated_hours: 15,
    description: 'Essential principles of web usability and user experience',
    is_free: false
  },

  // Electronics and Computer System Architecture
  {
    module_name: 'Electronics and Computer System Architecture',
    resource_type: 'book',
    resource_title: 'Computer Organization and Design: The Hardware/Software Interface',
    resource_url: 'https://www.elsevier.com/books/computer-organization-and-design-arm-edition/patterson/978-0-12-801733-3',
    resource_author: 'Patterson and Hennessy',
    difficulty_level: 3,
    topic_tags: ['Computer Architecture', 'Hardware Design', 'Assembly Language'],
    rating: 4.6,
    estimated_hours: 55,
    description: 'Comprehensive guide to computer organization and design',
    is_free: false
  },
  {
    module_name: 'Electronics and Computer System Architecture',
    resource_type: 'book',
    resource_title: 'But How Do It Know? - The Basic Principles of Computers for Everyone',
    resource_url: 'https://www.amazon.com/But-How-Know-Principles-Computers/dp/0615303765',
    resource_author: 'J. Clark Scott',
    difficulty_level: 1,
    topic_tags: ['Computer Basics', 'Hardware Fundamentals', 'Beginner'],
    rating: 4.4,
    estimated_hours: 20,
    description: 'Simple explanation of how computers work at the basic level',
    is_free: false
  },

  // Database Management
  {
    module_name: 'Database Management',
    resource_type: 'book',
    resource_title: 'Database System Concepts',
    resource_url: 'https://www.db-book.com/',
    resource_author: 'Silberschatz, Korth, and Sudarshan',
    difficulty_level: 3,
    topic_tags: ['Database Theory', 'SQL', 'Normalization'],
    rating: 4.7,
    estimated_hours: 50,
    description: 'Comprehensive database textbook covering all concepts',
    is_free: false
  },
  {
    module_name: 'Database Management',
    resource_type: 'book',
    resource_title: 'Designing Data-Intensive Applications',
    resource_url: 'https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/',
    resource_author: 'Martin Kleppmann',
    difficulty_level: 4,
    topic_tags: ['Big Data', 'Distributed Systems', 'Data Architecture'],
    rating: 4.8,
    estimated_hours: 60,
    description: 'Modern approaches to building scalable data systems',
    is_free: false
  }
];

// Comprehensive online resource recommendations
const onlineResources = [
  // Introduction to Computer Science
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'online',
    resource_title: 'CS50x by Harvard University',
    resource_url: 'https://cs50.harvard.edu/x/',
    resource_author: 'Harvard University',
    difficulty_level: 1,
    topic_tags: ['Computer Science', 'Programming', 'Problem Solving'],
    rating: 4.9,
    estimated_hours: 100,
    description: 'Harvard\'s introduction to computer science and programming',
    is_free: true
  },
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'online',
    resource_title: 'freeCodeCamp',
    resource_url: 'https://www.freecodecamp.org/',
    resource_author: 'freeCodeCamp',
    difficulty_level: 1,
    topic_tags: ['Web Development', 'Programming', 'Certification'],
    rating: 4.7,
    estimated_hours: 300,
    description: 'Free coding bootcamp with certifications',
    is_free: true
  },
  {
    module_name: 'Introduction to Computer Science',
    resource_type: 'online',
    resource_title: 'Khan Academy - Computing',
    resource_url: 'https://www.khanacademy.org/computing',
    resource_author: 'Khan Academy',
    difficulty_level: 1,
    topic_tags: ['Computer Science Basics', 'Programming', 'Algorithms'],
    rating: 4.5,
    estimated_hours: 50,
    description: 'Interactive computer science courses for beginners',
    is_free: true
  },

  // Mathematics for Computing
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'online',
    resource_title: '3Blue1Brown (YouTube)',
    resource_url: 'https://www.youtube.com/c/3blue1brown',
    resource_author: '3Blue1Brown',
    difficulty_level: 2,
    topic_tags: ['Linear Algebra', 'Calculus', 'Mathematical Visualization'],
    rating: 4.9,
    estimated_hours: 40,
    description: 'Visual and intuitive explanations of mathematical concepts',
    is_free: true
  },
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'online',
    resource_title: 'Khan Academy - Math',
    resource_url: 'https://www.khanacademy.org/math',
    resource_author: 'Khan Academy',
    difficulty_level: 1,
    topic_tags: ['Mathematics', 'Algebra', 'Statistics'],
    rating: 4.6,
    estimated_hours: 100,
    description: 'Comprehensive mathematics courses from basic to advanced',
    is_free: true
  },
  {
    module_name: 'Mathematics for Computing',
    resource_type: 'online',
    resource_title: 'MIT OpenCourseWare - Mathematics for Computer Science',
    resource_url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/',
    resource_author: 'MIT',
    difficulty_level: 3,
    topic_tags: ['Discrete Mathematics', 'Probability', 'Graph Theory'],
    rating: 4.7,
    estimated_hours: 80,
    description: 'MIT\'s mathematics course designed for computer science students',
    is_free: true
  },

  // Programming Fundamentals
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'online',
    resource_title: 'W3Schools',
    resource_url: 'https://www.w3schools.com/',
    resource_author: 'W3Schools',
    difficulty_level: 1,
    topic_tags: ['Web Technologies', 'Programming Languages', 'Tutorials'],
    rating: 4.3,
    estimated_hours: 50,
    description: 'Comprehensive web development and programming tutorials',
    is_free: true
  },
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'online',
    resource_title: 'LeetCode',
    resource_url: 'https://leetcode.com/',
    resource_author: 'LeetCode',
    difficulty_level: 2,
    topic_tags: ['Algorithm Practice', 'Coding Interview', 'Problem Solving'],
    rating: 4.6,
    estimated_hours: 200,
    description: 'Platform for practicing coding problems and algorithms',
    is_free: true
  },
  {
    module_name: 'Programming Fundamentals',
    resource_type: 'online',
    resource_title: 'Codecademy',
    resource_url: 'https://www.codecademy.com/',
    resource_author: 'Codecademy',
    difficulty_level: 1,
    topic_tags: ['Interactive Learning', 'Programming Languages', 'Web Development'],
    rating: 4.4,
    estimated_hours: 100,
    description: 'Interactive programming courses and projects',
    is_free: false
  },

  // Object-Oriented Programming (OOP)
  {
    module_name: 'Object-Oriented Programming (OOP)',
    resource_type: 'online',
    resource_title: 'Refactoring Guru - Design Patterns',
    resource_url: 'https://refactoring.guru/design-patterns',
    resource_author: 'Refactoring Guru',
    difficulty_level: 2,
    topic_tags: ['Design Patterns', 'OOP', 'Software Architecture'],
    rating: 4.8,
    estimated_hours: 30,
    description: 'Comprehensive guide to design patterns with examples',
    is_free: true
  },
  {
    module_name: 'Object-Oriented Programming (OOP)',
    resource_type: 'online',
    resource_title: 'DigitalOcean Community Tutorials',
    resource_url: 'https://www.digitalocean.com/community/tutorials',
    resource_author: 'DigitalOcean',
    difficulty_level: 2,
    topic_tags: ['Programming Tutorials', 'Software Development', 'Best Practices'],
    rating: 4.5,
    estimated_hours: 40,
    description: 'High-quality programming and development tutorials',
    is_free: true
  },
  {
    module_name: 'Object-Oriented Programming (OOP)',
    resource_type: 'online',
    resource_title: 'GeeksforGeeks - OOPs Concepts',
    resource_url: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/',
    resource_author: 'GeeksforGeeks',
    difficulty_level: 2,
    topic_tags: ['OOP Concepts', 'Java', 'Programming Theory'],
    rating: 4.2,
    estimated_hours: 25,
    description: 'Comprehensive OOP concepts with examples',
    is_free: true
  },

  // Computer Networks
  {
    module_name: 'Computer Networks',
    resource_type: 'online',
    resource_title: 'Cloudflare Learning Center',
    resource_url: 'https://www.cloudflare.com/learning/',
    resource_author: 'Cloudflare',
    difficulty_level: 2,
    topic_tags: ['Networking', 'Internet Security', 'Web Performance'],
    rating: 4.6,
    estimated_hours: 30,
    description: 'Modern networking concepts and internet technologies',
    is_free: true
  },
  {
    module_name: 'Computer Networks',
    resource_type: 'online',
    resource_title: 'Professor Messer\'s Network+ Course',
    resource_url: 'https://www.professormesser.com/network-plus/n10-008/n10-008-video/n10-008-training-course/',
    resource_author: 'Professor Messer',
    difficulty_level: 2,
    topic_tags: ['Network+', 'Certification', 'Networking Fundamentals'],
    rating: 4.7,
    estimated_hours: 60,
    description: 'Complete Network+ certification training course',
    is_free: true
  },
  {
    module_name: 'Computer Networks',
    resource_type: 'online',
    resource_title: 'Wireshark Documentation',
    resource_url: 'https://www.wireshark.org/docs/',
    resource_author: 'Wireshark Foundation',
    difficulty_level: 3,
    topic_tags: ['Network Analysis', 'Packet Capture', 'Troubleshooting'],
    rating: 4.4,
    estimated_hours: 20,
    description: 'Learn network analysis with Wireshark',
    is_free: true
  },

  // Operating Systems
  {
    module_name: 'Operating Systems',
    resource_type: 'online',
    resource_title: 'Operating Systems: Three Easy Pieces (OSTEP)',
    resource_url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    resource_author: 'Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau',
    difficulty_level: 3,
    topic_tags: ['Operating Systems', 'System Programming', 'Concurrency'],
    rating: 4.8,
    estimated_hours: 80,
    description: 'Free online operating systems textbook',
    is_free: true
  },
  {
    module_name: 'Operating Systems',
    resource_type: 'online',
    resource_title: 'GeeksforGeeks - Operating Systems',
    resource_url: 'https://www.geeksforgeeks.org/operating-systems/',
    resource_author: 'GeeksforGeeks',
    difficulty_level: 2,
    topic_tags: ['OS Concepts', 'System Calls', 'Process Management'],
    rating: 4.3,
    estimated_hours: 40,
    description: 'Comprehensive operating systems concepts and tutorials',
    is_free: true
  },
  {
    module_name: 'Operating Systems',
    resource_type: 'online',
    resource_title: 'Julia Evans\' Blog',
    resource_url: 'https://jvns.ca/',
    resource_author: 'Julia Evans',
    difficulty_level: 2,
    topic_tags: ['Systems Programming', 'Debugging', 'Linux'],
    rating: 4.7,
    estimated_hours: 20,
    description: 'Accessible explanations of systems programming concepts',
    is_free: true
  },

  // Introduction to Machine Learning
  {
    module_name: 'Introduction to Machine Learning',
    resource_type: 'online',
    resource_title: 'Coursera - Machine Learning Specialization by Andrew Ng',
    resource_url: 'https://www.coursera.org/specializations/machine-learning-introduction',
    resource_author: 'Andrew Ng',
    difficulty_level: 2,
    topic_tags: ['Machine Learning', 'Deep Learning', 'Neural Networks'],
    rating: 4.9,
    estimated_hours: 120,
    description: 'Comprehensive machine learning course by a leading expert',
    is_free: false
  },
  {
    module_name: 'Introduction to Machine Learning',
    resource_type: 'online',
    resource_title: 'Kaggle',
    resource_url: 'https://www.kaggle.com/learn',
    resource_author: 'Kaggle',
    difficulty_level: 2,
    topic_tags: ['Data Science', 'Machine Learning', 'Competitions'],
    rating: 4.6,
    estimated_hours: 80,
    description: 'Hands-on machine learning courses and competitions',
    is_free: true
  },
  {
    module_name: 'Introduction to Machine Learning',
    resource_type: 'online',
    resource_title: 'Scikit-learn User Guide',
    resource_url: 'https://scikit-learn.org/stable/user_guide.html',
    resource_author: 'Scikit-learn developers',
    difficulty_level: 2,
    topic_tags: ['Python', 'Machine Learning Library', 'Practical ML'],
    rating: 4.5,
    estimated_hours: 40,
    description: 'Official documentation and tutorials for scikit-learn',
    is_free: true
  },

  // Web Development
  {
    module_name: 'Web Development',
    resource_type: 'online',
    resource_title: 'MDN Web Docs',
    resource_url: 'https://developer.mozilla.org/',
    resource_author: 'Mozilla',
    difficulty_level: 2,
    topic_tags: ['Web Standards', 'HTML', 'CSS', 'JavaScript'],
    rating: 4.8,
    estimated_hours: 100,
    description: 'Comprehensive web development documentation and tutorials',
    is_free: true
  },
  {
    module_name: 'Web Development',
    resource_type: 'online',
    resource_title: 'The Odin Project',
    resource_url: 'https://www.theodinproject.com/',
    resource_author: 'The Odin Project',
    difficulty_level: 2,
    topic_tags: ['Full Stack Development', 'Project-Based Learning', 'Open Source'],
    rating: 4.7,
    estimated_hours: 200,
    description: 'Free full-stack web development curriculum',
    is_free: true
  },
  {
    module_name: 'Web Development',
    resource_type: 'online',
    resource_title: 'CSS-Tricks',
    resource_url: 'https://css-tricks.com/',
    resource_author: 'CSS-Tricks',
    difficulty_level: 2,
    topic_tags: ['CSS', 'Frontend Development', 'Web Design'],
    rating: 4.6,
    estimated_hours: 50,
    description: 'Advanced CSS techniques and web development tips',
    is_free: true
  },

  // Electronics and Computer System Architecture
  {
    module_name: 'Electronics and Computer System Architecture',
    resource_type: 'online',
    resource_title: 'Ben Eater (YouTube)',
    resource_url: 'https://www.youtube.com/c/BenEater',
    resource_author: 'Ben Eater',
    difficulty_level: 2,
    topic_tags: ['Computer Architecture', 'Electronics', 'Hardware'],
    rating: 4.9,
    estimated_hours: 60,
    description: 'Building computers from scratch and understanding hardware',
    is_free: true
  },
  {
    module_name: 'Electronics and Computer System Architecture',
    resource_type: 'online',
    resource_title: 'nand2tetris.org',
    resource_url: 'https://www.nand2tetris.org/',
    resource_author: 'Noam Nisan and Shimon Schocken',
    difficulty_level: 3,
    topic_tags: ['Computer Architecture', 'Hardware Design', 'System Building'],
    rating: 4.8,
    estimated_hours: 100,
    description: 'Build a computer system from NAND gates to Tetris',
    is_free: true
  },

  // Database Management
  {
    module_name: 'Database Management',
    resource_type: 'online',
    resource_title: 'SQLBolt',
    resource_url: 'https://sqlbolt.com/',
    resource_author: 'SQLBolt',
    difficulty_level: 1,
    topic_tags: ['SQL', 'Database Queries', 'Interactive Learning'],
    rating: 4.5,
    estimated_hours: 15,
    description: 'Interactive SQL tutorial with hands-on exercises',
    is_free: true
  },
  {
    module_name: 'Database Management',
    resource_type: 'online',
    resource_title: 'PGExercises',
    resource_url: 'https://pgexercises.com/',
    resource_author: 'PGExercises',
    difficulty_level: 2,
    topic_tags: ['PostgreSQL', 'SQL Practice', 'Advanced Queries'],
    rating: 4.4,
    estimated_hours: 25,
    description: 'PostgreSQL exercises from beginner to advanced',
    is_free: true
  },
  {
    module_name: 'Database Management',
    resource_type: 'online',
    resource_title: 'W3Schools - SQL Tutorial',
    resource_url: 'https://www.w3schools.com/sql/',
    resource_author: 'W3Schools',
    difficulty_level: 1,
    topic_tags: ['SQL Basics', 'Database Fundamentals', 'Beginner'],
    rating: 4.2,
    estimated_hours: 20,
    description: 'Comprehensive SQL tutorial for beginners',
    is_free: true
  }
];

async function seedResources() {
  try {
    console.log('🚀 Starting to seed comprehensive resources...');
    
    // Add books
    console.log('📚 Adding books...');
    for (const book of books) {
      try {
        const docRef = await db.collection('books').add({
          ...book,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Added book: ${book.resource_title} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`❌ Error adding book ${book.resource_title}:`, error);
      }
    }
    
    // Add online resources
    console.log('🌐 Adding online resources...');
    for (const resource of onlineResources) {
      try {
        const docRef = await db.collection('online_resources').add({
          ...resource,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Added online resource: ${resource.resource_title} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`❌ Error adding online resource ${resource.resource_title}:`, error);
      }
    }
    
    console.log('🎉 Successfully seeded all comprehensive resources!');
    console.log(`📊 Total books added: ${books.length}`);
    console.log(`📊 Total online resources added: ${onlineResources.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding resources:', error);
  }
}

// Run the seeding function
seedResources().then(() => {
  console.log('✨ Seeding completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});