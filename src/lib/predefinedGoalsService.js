/**
 * Predefined Goals Service
 * Contains fallback goals to use when ML model doesn't return goals for repeat modules
 */

const PREDEFINED_GOALS = {
  'Introduction to Computer Science': [
    {
      'goal_title': 'Master Programming Fundamentals',
      'goal_description': 'Learn basic programming concepts, syntax, and problem-solving techniques',
      'success_criteria': ['Write simple programs', 'Understand variables and data types', 'Use control structures effectively', 'Debug basic errors', 'Complete programming assignments']
    },
    {
      'goal_title': 'Understand Computer Science Concepts',
      'goal_description': 'Grasp fundamental CS concepts including algorithms and data structures',
      'success_criteria': ['Explain basic algorithms', 'Understand time complexity', 'Describe common data structures', 'Solve computational problems', 'Apply CS thinking']
    },
    {
      'goal_title': 'Develop Problem-Solving Skills',
      'goal_description': 'Enhance logical thinking and computational problem-solving abilities',
      'success_criteria': ['Break down complex problems', 'Design step-by-step solutions', 'Test and validate solutions', 'Optimize problem approaches', 'Apply debugging strategies']
    },
    {
      'goal_title': 'Complete Course Assignments',
      'goal_description': 'Successfully complete all assignments and practical exercises',
      'success_criteria': ['Submit assignments on time', 'Achieve passing grades', 'Understand assignment requirements', 'Implement required features', 'Document code properly']
    },
    {
      'goal_title': 'Prepare for Final Assessment',
      'goal_description': 'Review all topics and prepare thoroughly for the final examination',
      'success_criteria': ['Review all course materials', 'Practice past exam questions', 'Understand key concepts', 'Complete practice exercises', 'Achieve target score']
    }
  ],
  'Mathematics for Computing': [
    {
      'goal_title': 'Master Discrete Mathematics',
      'goal_description': 'Understand discrete mathematical concepts essential for computer science',
      'success_criteria': ['Solve logic problems', 'Work with sets and relations', 'Understand graph theory', 'Apply combinatorics', 'Use mathematical proofs']
    },
    {
      'goal_title': 'Develop Statistical Understanding',
      'goal_description': 'Learn probability and statistics concepts for data analysis',
      'success_criteria': ['Calculate probabilities', 'Understand distributions', 'Apply statistical tests', 'Analyze data sets', 'Interpret statistical results']
    },
    {
      'goal_title': 'Strengthen Algebra Skills',
      'goal_description': 'Master algebraic concepts and linear algebra applications',
      'success_criteria': ['Solve linear equations', 'Work with matrices', 'Understand vector spaces', 'Apply algebraic methods', 'Use mathematical software']
    },
    {
      'goal_title': 'Practice Mathematical Problem Solving',
      'goal_description': 'Develop skills in approaching and solving mathematical problems',
      'success_criteria': ['Apply mathematical methods', 'Show clear working', 'Verify solutions', 'Use appropriate notation', 'Explain mathematical reasoning']
    },
    {
      'goal_title': 'Connect Math to Computing',
      'goal_description': 'Understand how mathematical concepts apply to computer science',
      'success_criteria': ['Apply math in algorithms', 'Use math for optimization', 'Understand complexity analysis', 'Model computational problems', 'Use mathematical tools']
    }
  ],
  'Programming Fundamentals': [
    {
      'goal_title': 'Master Programming Syntax',
      'goal_description': 'Learn and practice fundamental programming language syntax and constructs',
      'success_criteria': ['Write syntactically correct code', 'Use variables and data types', 'Implement control structures', 'Define and call functions', 'Handle input and output']
    },
    {
      'goal_title': 'Develop Algorithm Skills',
      'goal_description': 'Learn to design and implement basic algorithms and data structures',
      'success_criteria': ['Design simple algorithms', 'Implement sorting algorithms', 'Use arrays and lists', 'Understand algorithm efficiency', 'Solve algorithmic problems']
    },
    {
      'goal_title': 'Practice Problem Solving',
      'goal_description': 'Enhance programming problem-solving and debugging skills',
      'success_criteria': ['Break down programming problems', 'Debug code effectively', 'Test programs thoroughly', 'Handle edge cases', 'Optimize solutions']
    },
    {
      'goal_title': 'Build Programming Projects',
      'goal_description': 'Create complete programming projects to apply learned concepts',
      'success_criteria': ['Plan project structure', 'Implement required features', 'Write clean, readable code', 'Document code properly', 'Present working solutions']
    },
    {
      'goal_title': 'Learn Best Practices',
      'goal_description': 'Adopt good programming practices and coding standards',
      'success_criteria': ['Follow coding conventions', 'Write maintainable code', 'Use version control', 'Practice code reviews', 'Apply software engineering principles']
    }
  ],
  'Object Oriented Programming': [
    {
      'goal_title': 'Understand OOP Principles',
      'goal_description': 'Master the fundamental principles of object-oriented programming',
      'success_criteria': ['Explain encapsulation concepts', 'Understand inheritance', 'Apply polymorphism', 'Use abstraction effectively', 'Design class hierarchies']
    },
    {
      'goal_title': 'Design and Implement Classes',
      'goal_description': 'Learn to design effective classes and objects for real-world problems',
      'success_criteria': ['Create well-designed classes', 'Implement constructors and methods', 'Use access modifiers properly', 'Design class relationships', 'Apply design patterns']
    },
    {
      'goal_title': 'Master Advanced OOP Concepts',
      'goal_description': 'Learn advanced OOP features like interfaces, abstract classes, and generics',
      'success_criteria': ['Implement interfaces', 'Use abstract classes', 'Work with generics', 'Handle exceptions properly', 'Use advanced OOP features']
    },
    {
      'goal_title': 'Build Object-Oriented Applications',
      'goal_description': 'Create complete applications using object-oriented design principles',
      'success_criteria': ['Design application architecture', 'Implement business logic', 'Create user interfaces', 'Handle data persistence', 'Test application thoroughly']
    },
    {
      'goal_title': 'Apply Design Patterns',
      'goal_description': 'Learn and apply common software design patterns in OOP',
      'success_criteria': ['Understand design patterns', 'Implement common patterns', 'Choose appropriate patterns', 'Refactor code using patterns', 'Evaluate pattern effectiveness']
    }
  ],
  'Computer Networks': [
    {
      'goal_title': 'Understand Network Fundamentals',
      'goal_description': 'Learn basic networking concepts and the OSI model',
      'success_criteria': ['Explain OSI layers', 'Understand TCP/IP protocol', 'Know network topologies', 'Understand routing basics', 'Configure basic networks']
    },
    {
      'goal_title': 'Master Network Protocols',
      'goal_description': 'Study and understand various network protocols and their applications',
      'success_criteria': ['Understand HTTP/HTTPS', 'Know DNS functionality', 'Learn DHCP concepts', 'Study FTP protocols', 'Analyze protocol behavior']
    },
    {
      'goal_title': 'Learn Network Security',
      'goal_description': 'Understand network security principles and common threats',
      'success_criteria': ['Identify security threats', 'Understand encryption basics', 'Configure firewalls', 'Implement security measures', 'Analyze security incidents']
    },
    {
      'goal_title': 'Practice Network Configuration',
      'goal_description': 'Gain hands-on experience with network setup and troubleshooting',
      'success_criteria': ['Configure network devices', 'Set up network services', 'Troubleshoot connectivity', 'Monitor network performance', 'Document network configurations']
    },
    {
      'goal_title': 'Study Modern Networking',
      'goal_description': 'Learn about modern networking technologies and trends',
      'success_criteria': ['Understand cloud networking', 'Learn about SDN concepts', 'Study wireless technologies', 'Explore network virtualization', 'Analyze network trends']
    }
  ],
  'Operating Systems': [
    {
      'goal_title': 'Understand OS Fundamentals',
      'goal_description': 'Learn core operating system concepts and functionality',
      'success_criteria': ['Explain OS components', 'Understand system calls', 'Know process management', 'Learn memory management', 'Study file systems']
    },
    {
      'goal_title': 'Master Process Management',
      'goal_description': 'Study process creation, scheduling, and synchronization',
      'success_criteria': ['Understand process lifecycle', 'Learn scheduling algorithms', 'Study inter-process communication', 'Handle process synchronization', 'Manage deadlocks']
    },
    {
      'goal_title': 'Learn Memory Management',
      'goal_description': 'Understand how operating systems manage memory resources',
      'success_criteria': ['Study memory allocation', 'Understand virtual memory', 'Learn paging concepts', 'Study memory protection', 'Optimize memory usage']
    },
    {
      'goal_title': 'Study File Systems',
      'goal_description': 'Learn about file system design and implementation',
      'success_criteria': ['Understand file structures', 'Learn directory management', 'Study file allocation methods', 'Handle file permissions', 'Optimize file access']
    },
    {
      'goal_title': 'Practice System Programming',
      'goal_description': 'Gain experience with system-level programming and tools',
      'success_criteria': ['Write system programs', 'Use system utilities', 'Debug system issues', 'Monitor system performance', 'Script system tasks']
    }
  ],
  'Introduction to Machine Learning': [
    {
      'goal_title': 'Understand ML Fundamentals',
      'goal_description': 'Learn basic machine learning concepts and terminology',
      'success_criteria': ['Explain ML types', 'Understand supervised learning', 'Know unsupervised learning', 'Learn reinforcement learning', 'Identify ML applications']
    },
    {
      'goal_title': 'Learn Data Preprocessing',
      'goal_description': 'Master data cleaning, preparation, and feature engineering techniques',
      'success_criteria': ['Clean datasets effectively', 'Handle missing data', 'Normalize and scale features', 'Engineer useful features', 'Split data properly']
    },
    {
      'goal_title': 'Implement ML Algorithms',
      'goal_description': 'Practice implementing and using common machine learning algorithms',
      'success_criteria': ['Implement linear regression', 'Use classification algorithms', 'Apply clustering methods', 'Understand neural networks', 'Evaluate model performance']
    },
    {
      'goal_title': 'Work with ML Libraries',
      'goal_description': 'Learn to use popular machine learning libraries and frameworks',
      'success_criteria': ['Use scikit-learn effectively', 'Work with pandas for data', 'Visualize data with matplotlib', 'Try deep learning frameworks', 'Build ML pipelines']
    },
    {
      'goal_title': 'Build ML Projects',
      'goal_description': 'Create complete machine learning projects from data to deployment',
      'success_criteria': ['Define project objectives', 'Collect and prepare data', 'Train and validate models', 'Evaluate results critically', 'Present findings clearly']
    }
  ],
  'Web Development': [
    {
      'goal_title': 'Master HTML and CSS',
      'goal_description': 'Learn to create structured and styled web pages',
      'success_criteria': ['Write semantic HTML', 'Style with CSS effectively', 'Create responsive layouts', 'Use CSS frameworks', 'Follow web standards']
    },
    {
      'goal_title': 'Learn JavaScript Programming',
      'goal_description': 'Master JavaScript for interactive web development',
      'success_criteria': ['Understand JS fundamentals', 'Manipulate DOM elements', 'Handle events effectively', 'Use modern JS features', 'Debug JS applications']
    },
    {
      'goal_title': 'Build Dynamic Web Applications',
      'goal_description': 'Create interactive web applications with frontend frameworks',
      'success_criteria': ['Use a JS framework', 'Manage application state', 'Handle user interactions', 'Implement routing', 'Optimize performance']
    },
    {
      'goal_title': 'Learn Backend Development',
      'goal_description': 'Understand server-side development and APIs',
      'success_criteria': ['Build REST APIs', 'Work with databases', 'Handle authentication', 'Manage server deployment', 'Implement security measures']
    },
    {
      'goal_title': 'Deploy Web Applications',
      'goal_description': 'Learn to deploy and maintain web applications in production',
      'success_criteria': ['Deploy to cloud platforms', 'Configure domain names', 'Set up SSL certificates', 'Monitor application health', 'Handle production issues']
    }
  ],
  'Electronics and Computer System Architecture': [
    {
      'goal_title': 'Understand Digital Logic',
      'goal_description': 'Master digital logic fundamentals and Boolean algebra',
      'success_criteria': ['Design logic circuits', 'Use Boolean algebra', 'Understand logic gates', 'Build combinational circuits', 'Design sequential circuits']
    },
    {
      'goal_title': 'Learn Computer Architecture',
      'goal_description': 'Study computer organization and processor design',
      'success_criteria': ['Understand CPU architecture', 'Learn instruction sets', 'Study memory hierarchy', 'Understand pipelining', 'Analyze performance factors']
    },
    {
      'goal_title': 'Study Assembly Language',
      'goal_description': 'Learn assembly language programming and computer internals',
      'success_criteria': ['Write assembly programs', 'Understand machine code', 'Use assembly tools', 'Debug assembly code', 'Optimize assembly programs']
    },
    {
      'goal_title': 'Explore System Design',
      'goal_description': 'Learn about computer system design and implementation',
      'success_criteria': ['Design simple computers', 'Understand bus systems', 'Study I/O systems', 'Learn about interrupts', 'Analyze system performance']
    },
    {
      'goal_title': 'Practice Hardware Programming',
      'goal_description': 'Gain experience with hardware description languages and tools',
      'success_criteria': ['Use HDL languages', 'Simulate digital circuits', 'Design with CAD tools', 'Test hardware designs', 'Understand timing analysis']
    }
  ],
  'Database Management': [
    {
      'goal_title': 'Master SQL Fundamentals',
      'goal_description': 'Learn to write effective SQL queries for data retrieval and manipulation',
      'success_criteria': ['Write basic SELECT queries', 'Use JOIN operations', 'Apply aggregate functions', 'Handle subqueries', 'Optimize query performance']
    },
    {
      'goal_title': 'Learn Database Design',
      'goal_description': 'Understand database design principles and normalization',
      'success_criteria': ['Design ER diagrams', 'Apply normalization rules', 'Create database schemas', 'Define relationships', 'Ensure data integrity']
    },
    {
      'goal_title': 'Study Database Administration',
      'goal_description': 'Learn database administration and maintenance tasks',
      'success_criteria': ['Install database systems', 'Configure database settings', 'Manage user accounts', 'Perform backups', 'Monitor database performance']
    },
    {
      'goal_title': 'Explore Advanced Features',
      'goal_description': 'Study advanced database features like triggers, procedures, and views',
      'success_criteria': ['Create stored procedures', 'Implement triggers', 'Design database views', 'Use indexing strategies', 'Handle transactions']
    },
    {
      'goal_title': 'Work with Modern Databases',
      'goal_description': 'Learn about NoSQL databases and modern data storage solutions',
      'success_criteria': ['Understand NoSQL concepts', 'Work with document databases', 'Use cloud databases', 'Handle big data challenges', 'Choose appropriate database types']
    }
  ]
};

class PredefinedGoalsService {
  /**
   * Get predefined goals for a module when ML model doesn't return goals
   * @param {string} moduleName - The module name
   * @returns {Object} Formatted goals object matching ML API structure
   */
  static getGoalsForModule(moduleName) {
    // Try exact match first
    let goals = PREDEFINED_GOALS[moduleName];
    
    // If no exact match, try partial matching for common variations
    if (!goals) {
      const moduleNameLower = moduleName.toLowerCase();
      for (const [key, value] of Object.entries(PREDEFINED_GOALS)) {
        if (key.toLowerCase().includes(moduleNameLower) || moduleNameLower.includes(key.toLowerCase())) {
          goals = value;
          break;
        }
      }
    }
    
    // If still no match, return default goals
    if (!goals) {
      goals = [
        {
          'goal_title': 'Review Core Concepts',
          'goal_description': 'Thoroughly review and understand the fundamental concepts of this module',
          'success_criteria': ['Read course materials', 'Take notes on key concepts', 'Practice problems', 'Seek help when needed', 'Complete practice exercises']
        },
        {
          'goal_title': 'Practice Regularly',
          'goal_description': 'Maintain consistent practice to reinforce learning',
          'success_criteria': ['Study daily', 'Complete assignments', 'Practice problem-solving', 'Review mistakes', 'Track progress']
        },
        {
          'goal_title': 'Prepare for Assessment',
          'goal_description': 'Prepare thoroughly for the module assessment',
          'success_criteria': ['Review all topics', 'Practice past questions', 'Understand assessment format', 'Plan study schedule', 'Get adequate rest']
        }
      ];
    }
    
    // Format goals to match ML API structure
    const formattedGoals = goals.map((goal, index) => ({
      goal_id: `predefined_${Date.now()}_${index}`,
      goal_title: goal.goal_title,
      goal_description: goal.goal_description,
      module_name: moduleName,
      priority_level: index < 2 ? 'high' : 'medium',
      current_progress: 0,
      target_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      days_remaining: 30,
      success_criteria: goal.success_criteria || []
    }));
    
    return {
      student_id: null, // Will be set by the calling function
      goals: formattedGoals,
      completion_stats: {
        total_goals: formattedGoals.length,
        high_priority_goals: formattedGoals.filter(g => g.priority_level === 'high').length,
        completion_rate: 0.0
      },
      recommendations: {
        suggested_daily_study_hours: 2,
        estimated_completion_weeks: 4
      }
    };
  }
  
  /**
   * Check if predefined goals are available for a module
   * @param {string} moduleName - The module name
   * @returns {boolean} True if predefined goals exist
   */
  static hasGoalsForModule(moduleName) {
    return !!PREDEFINED_GOALS[moduleName] || 
           Object.keys(PREDEFINED_GOALS).some(key => 
             key.toLowerCase().includes(moduleName.toLowerCase()) || 
             moduleName.toLowerCase().includes(key.toLowerCase())
           );
  }
}

export default PredefinedGoalsService;