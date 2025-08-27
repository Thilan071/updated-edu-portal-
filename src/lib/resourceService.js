// lib/resourceService.js
import { adminDb } from './firebaseAdmin';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const BOOKS_COLLECTION = 'books';
const ONLINE_RESOURCES_COLLECTION = 'online_resources';

export class ResourceService {
  /**
   * Add a book to Firebase
   * @param {Object} bookData - Book information
   */
  static async addBook(bookData) {
    try {
      const bookRef = await adminDb.collection(BOOKS_COLLECTION).add({
        ...bookData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: bookRef.id, ...bookData };
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }

  /**
   * Add an online resource to Firebase
   * @param {Object} resourceData - Online resource information
   */
  static async addOnlineResource(resourceData) {
    try {
      const resourceRef = await adminDb.collection(ONLINE_RESOURCES_COLLECTION).add({
        ...resourceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: resourceRef.id, ...resourceData };
    } catch (error) {
      console.error('Error adding online resource:', error);
      throw error;
    }
  }

  /**
   * Get all books from Firebase
   */
  static async getAllBooks() {
    try {
      const snapshot = await adminDb.collection(BOOKS_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  /**
   * Get all online resources from Firebase
   */
  static async getAllOnlineResources() {
    try {
      const snapshot = await adminDb.collection(ONLINE_RESOURCES_COLLECTION).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching online resources:', error);
      throw error;
    }
  }

  /**
   * Get books by module/subject
   * @param {string} module - Module name
   * @param {number} limitCount - Number of books to return
   */
  static async getBooksByModule(module, limitCount = 5) {
    try {
      const snapshot = await adminDb.collection(BOOKS_COLLECTION)
        .where('module_name', '==', module)
        .orderBy('rating', 'desc')
        .limit(limitCount)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching books by module:', error);
      throw error;
    }
  }

  /**
   * Get online resources by module/subject
   * @param {string} module - Module name
   * @param {number} limitCount - Number of resources to return
   */
  static async getOnlineResourcesByModule(module, limitCount = 5) {
    try {
      const snapshot = await adminDb.collection(ONLINE_RESOURCES_COLLECTION)
        .where('module_name', '==', module)
        .orderBy('rating', 'desc')
        .limit(limitCount)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching online resources by module:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations based on student profile
   * @param {string} studentId - Student ID
   * @param {Array} modules - Student's enrolled modules
   * @param {string} difficultyLevel - Student's difficulty preference
   */
  static async getPersonalizedRecommendations(studentId, modules, difficultyLevel = 'intermediate') {
    try {
      const recommendations = {
        books: [],
        online_resources: []
      };

      // Get books for each module
      for (const module of modules) {
        const moduleBooks = await this.getBooksByModule(module, 3);
        recommendations.books.push(...moduleBooks);
      }

      // Get online resources for each module
      for (const module of modules) {
        const moduleResources = await this.getOnlineResourcesByModule(module, 3);
        recommendations.online_resources.push(...moduleResources);
      }

      // Filter by difficulty level if specified
      if (difficultyLevel) {
        const difficultyMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        const targetDifficulty = difficultyMap[difficultyLevel] || 2;
        
        recommendations.books = recommendations.books.filter(
          book => Math.abs(book.difficulty_level - targetDifficulty) <= 1
        );
        recommendations.online_resources = recommendations.online_resources.filter(
          resource => Math.abs(resource.difficulty_level - targetDifficulty) <= 1
        );
      }

      // Remove duplicates and limit results
      recommendations.books = recommendations.books
        .filter((book, index, self) => 
          index === self.findIndex(b => b.resource_title === book.resource_title)
        )
        .slice(0, 5);
      
      recommendations.online_resources = recommendations.online_resources
        .filter((resource, index, self) => 
          index === self.findIndex(r => r.resource_title === resource.resource_title)
        )
        .slice(0, 5);

      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Seed initial data to Firebase collections
   */
  static async seedInitialData() {
    try {
      // Sample books data
      const sampleBooks = [
        {
          module_name: 'Database Management',
          resource_type: 'book',
          resource_title: 'Database System Concepts',
          resource_url: 'https://www.db-book.com/',
          resource_author: 'Silberschatz, Korth, Sudarshan',
          difficulty_level: 3,
          topic_tags: ['Database Theory', 'SQL', 'Normalization'],
          rating: 4.7,
          estimated_hours: 40,
          description: 'Comprehensive database textbook covering all concepts',
          is_free: false
        },
        {
          module_name: 'Computer Networks',
          resource_type: 'book',
          resource_title: 'Computer Networking: A Top-Down Approach',
          resource_url: 'https://gaia.cs.umass.edu/kurose_ross/index.php',
          resource_author: 'James Kurose, Keith Ross',
          difficulty_level: 2,
          topic_tags: ['Networking', 'Protocols', 'Internet'],
          rating: 4.6,
          estimated_hours: 35,
          description: 'Top-down approach to computer networking',
          is_free: false
        },
        {
          module_name: 'Software Engineering',
          resource_type: 'book',
          resource_title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          resource_url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/',
          resource_author: 'Robert C. Martin',
          difficulty_level: 2,
          topic_tags: ['Clean Code', 'Best Practices', 'Refactoring'],
          rating: 4.8,
          estimated_hours: 25,
          description: 'Essential guide to writing clean, maintainable code',
          is_free: false
        },
        {
          module_name: 'Algorithms',
          resource_type: 'book',
          resource_title: 'Introduction to Algorithms',
          resource_url: 'https://mitpress.mit.edu/books/introduction-algorithms-third-edition',
          resource_author: 'Thomas H. Cormen, Charles E. Leiserson',
          difficulty_level: 3,
          topic_tags: ['Algorithms', 'Data Structures', 'Complexity'],
          rating: 4.5,
          estimated_hours: 50,
          description: 'Comprehensive introduction to algorithms and data structures',
          is_free: false
        },
        {
          module_name: 'Cybersecurity',
          resource_type: 'book',
          resource_title: 'Cybersecurity Essentials',
          resource_url: 'https://www.ciscopress.com/store/cybersecurity-essentials-9781587134388',
          resource_author: 'Charles J. Brooks',
          difficulty_level: 1,
          topic_tags: ['Security', 'Network Security', 'Risk Management'],
          rating: 4.3,
          estimated_hours: 20,
          description: 'Essential cybersecurity concepts and practices',
          is_free: false
        }
      ];

      // Sample online resources data
      const sampleOnlineResources = [
        {
          module_name: 'Database Management',
          resource_type: 'online',
          resource_title: 'W3Schools SQL Tutorial',
          resource_url: 'https://www.w3schools.com/sql/',
          resource_author: 'W3Schools',
          difficulty_level: 1,
          topic_tags: ['SQL', 'Queries', 'Database Design'],
          rating: 4.5,
          estimated_hours: 10,
          description: 'Comprehensive SQL tutorial with interactive examples',
          is_free: true
        },
        {
          module_name: 'Computer Networks',
          resource_type: 'online',
          resource_title: 'Cisco Networking Academy',
          resource_url: 'https://www.netacad.com/',
          resource_author: 'Cisco',
          difficulty_level: 2,
          topic_tags: ['Networking', 'CCNA', 'Routing'],
          rating: 4.4,
          estimated_hours: 30,
          description: 'Professional networking courses from Cisco',
          is_free: false
        },
        {
          module_name: 'Software Engineering',
          resource_type: 'online',
          resource_title: 'freeCodeCamp',
          resource_url: 'https://www.freecodecamp.org/',
          resource_author: 'freeCodeCamp',
          difficulty_level: 1,
          topic_tags: ['Web Development', 'Programming', 'Projects'],
          rating: 4.7,
          estimated_hours: 100,
          description: 'Free coding bootcamp with hands-on projects',
          is_free: true
        },
        {
          module_name: 'Algorithms',
          resource_type: 'online',
          resource_title: 'LeetCode',
          resource_url: 'https://leetcode.com/',
          resource_author: 'LeetCode',
          difficulty_level: 2,
          topic_tags: ['Algorithm Practice', 'Coding Interview', 'Problem Solving'],
          rating: 4.6,
          estimated_hours: 50,
          description: 'Platform for practicing coding problems and algorithms',
          is_free: true
        },
        {
          module_name: 'Cybersecurity',
          resource_type: 'online',
          resource_title: 'Cybrary',
          resource_url: 'https://www.cybrary.it/',
          resource_author: 'Cybrary',
          difficulty_level: 1,
          topic_tags: ['Security Training', 'Ethical Hacking', 'Compliance'],
          rating: 4.2,
          estimated_hours: 40,
          description: 'Free cybersecurity training platform',
          is_free: true
        }
      ];

      // Add books to Firebase
      for (const book of sampleBooks) {
        await this.addBook(book);
      }

      // Add online resources to Firebase
      for (const resource of sampleOnlineResources) {
        await this.addOnlineResource(resource);
      }

      console.log('Initial data seeded successfully!');
      return { success: true, message: 'Initial data seeded successfully' };
    } catch (error) {
      console.error('Error seeding initial data:', error);
      throw error;
    }
  }
}

export default ResourceService;