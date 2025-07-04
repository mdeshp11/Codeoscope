import { Project, CodeFile, CodeComponent } from '../types';

export const MOCK_PROJECT: Project = {
  id: 'proj-1',
  name: 'React E-commerce App',
  description: 'A sample React e-commerce application with Redux state management',
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
  files: [
    {
      id: 'file-1',
      name: 'UserService.js',
      type: 'file',
      language: 'javascript',
      content: `class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.cache = new Map();
  }

  async fetchUser(userId) {
    if (this.cache.has(userId)) {
      return this.cache.get(userId);
    }
    
    const user = await this.apiClient.get(\`/users/\${userId}\`);
    this.cache.set(userId, user);
    return user;
  }

  async updateUser(userId, userData) {
    const updatedUser = await this.apiClient.put(\`/users/\${userId}\`, userData);
    this.cache.set(userId, updatedUser);
    return updatedUser;
  }

  clearCache() {
    this.cache.clear();
  }
}`,
      explanation: 'UserService implements a caching layer for user data operations, reducing API calls and improving performance.',
      children: ['class-1', 'func-1', 'func-2', 'func-3']
    },
    {
      id: 'class-1',
      name: 'UserService',
      type: 'class',
      language: 'javascript',
      content: 'class UserService',
      parent: 'file-1',
      explanation: 'Main service class for handling user-related operations with built-in caching mechanism.',
      startLine: 1,
      endLine: 25
    },
    {
      id: 'func-1',
      name: 'fetchUser',
      type: 'function',
      language: 'javascript',
      content: 'async fetchUser(userId)',
      parent: 'class-1',
      explanation: 'Retrieves user data with cache-first strategy to minimize API requests.',
      startLine: 6,
      endLine: 13
    },
    {
      id: 'func-2',
      name: 'updateUser',
      type: 'function',
      language: 'javascript',
      content: 'async updateUser(userId, userData)',
      parent: 'class-1',
      explanation: 'Updates user data and refreshes cache to maintain data consistency.',
      startLine: 15,
      endLine: 20
    }
  ]
};

export const MOCK_COMPONENTS: CodeComponent[] = [
  {
    id: 'comp-1',
    name: 'UserService',
    type: 'class',
    signature: 'class UserService',
    purpose: 'Provides a service layer for user data operations with caching',
    designPattern: 'Service Pattern with Caching',
    tradeoffs: [
      'Memory usage increases with cache size',
      'Cache invalidation complexity',
      'Better performance vs memory consumption'
    ],
    dependencies: ['apiClient'],
    file: 'UserService.js',
    startLine: 1,
    endLine: 25
  },
  {
    id: 'comp-2',
    name: 'fetchUser',
    type: 'method',
    signature: 'async fetchUser(userId: string): Promise<User>',
    purpose: 'Retrieves user data with cache-first approach to reduce API calls',
    designPattern: 'Cache-Aside Pattern',
    tradeoffs: [
      'Faster subsequent requests',
      'Potential stale data issues',
      'Memory overhead for caching'
    ],
    dependencies: ['apiClient', 'cache'],
    file: 'UserService.js',
    startLine: 6,
    endLine: 13
  }
];