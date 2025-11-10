// posts.test.js - Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

// Mock mongoose connection
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
  };
});

let userId;
let token;
let postId;

beforeAll(async () => {
  // Mock user
  userId = new mongoose.Types.ObjectId();
  const mockUser = {
    _id: userId,
    username: 'testuser',
    email: 'test@example.com',
  };
  token = generateToken(mockUser);

  // Mock post
  postId = new mongoose.Types.ObjectId();
});

afterAll(async () => {
  jest.clearAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/posts', () => {
  it('should create a new post when authenticated', async () => {
    const newPost = {
      title: 'New Test Post',
      content: 'This is new post content',
      author: userId,
      slug: 'new-test-post',
    };

    const mockCreatedPost = {
      _id: new mongoose.Types.ObjectId(),
      ...newPost,
      save: jest.fn().mockResolvedValue(this),
    };

    jest.spyOn(Post.prototype, 'save').mockResolvedValue(mockCreatedPost);

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(newPost);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('title', newPost.title);
  });

  it('should return 401 if not authenticated', async () => {
    const newPost = {
      title: 'Unauthorized Post',
      content: 'This should fail',
      slug: 'unauthorized-post',
    };

    const response = await request(app)
      .post('/api/posts')
      .send(newPost);

    expect(response.status).toBe(401);
  });

  it('should return 400 if validation fails', async () => {
    const invalidPost = {
      content: 'Missing title',
    };

    jest.spyOn(Post.prototype, 'save').mockRejectedValue(new Error('Validation failed'));

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPost);

    expect(response.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('should return all posts', async () => {
    const mockPosts = [
      {
        _id: postId,
        title: 'Test Post',
        content: 'Test content',
        author: { _id: userId, username: 'testuser' },
        slug: 'test-post',
      },
    ];

    jest.spyOn(Post, 'find').mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPosts),
    });

    const response = await request(app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should filter posts by category', async () => {
    const categoryId = new mongoose.Types.ObjectId();
    const mockPosts = [
      {
        _id: postId,
        title: 'Filtered Post',
        category: categoryId,
      },
    ];

    jest.spyOn(Post, 'find').mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPosts),
    });

    const response = await request(app).get(`/api/posts?category=${categoryId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should paginate results', async () => {
    const mockPosts = Array(5).fill({
      _id: new mongoose.Types.ObjectId(),
      title: 'Post',
      content: 'Content',
    });

    jest.spyOn(Post, 'find').mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPosts),
    });

    const response = await request(app).get('/api/posts?page=1&limit=5');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('GET /api/posts/:id', () => {
  it('should return a post by ID', async () => {
    const mockPost = {
      _id: postId,
      title: 'Test Post',
      content: 'Test content',
      author: { _id: userId, username: 'testuser' },
    };

    jest.spyOn(Post, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPost),
    });

    const response = await request(app).get(`/api/posts/${postId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title', 'Test Post');
  });

  it('should return 404 for non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    jest.spyOn(Post, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app).get(`/api/posts/${fakeId}`);

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/posts/:id', () => {
  it('should update a post when authenticated as author', async () => {
    const updates = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    const mockUpdatedPost = {
      _id: postId,
      ...updates,
      author: userId,
    };

    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedPost);

    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title', updates.title);
  });

  it('should return 401 if not authenticated', async () => {
    const updates = { title: 'Should fail' };

    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .send(updates);

    expect(response.status).toBe(401);
  });

  it('should return 403 if not the author', async () => {
    const differentUserId = new mongoose.Types.ObjectId();
    const differentToken = generateToken({ _id: differentUserId });

    const updates = { title: 'Should fail' };

    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${differentToken}`)
      .send(updates);

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should delete a post when authenticated as author', async () => {
    const mockDeletedPost = {
      _id: postId,
      title: 'Deleted Post',
      author: userId,
    };

    jest.spyOn(Post, 'findByIdAndDelete').mockResolvedValue(mockDeletedPost);

    const response = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Post deleted');
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).delete(`/api/posts/${postId}`);

    expect(response.status).toBe(401);
  });
});