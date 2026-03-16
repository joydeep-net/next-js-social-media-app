'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('feed');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(savedUser);
      fetchPosts();
      fetchBookmarkIds(savedUser);
    }
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
  };

  const fetchBookmarkIds = async (username) => {
    const res = await fetch(`/api/posts/readit?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setBookmarkedIds(new Set(data.map(p => p._id)));
    }
  };

  const fetchBookmarkedPosts = async () => {
    const res = await fetch(`/api/posts/readit?username=${encodeURIComponent(user)}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setPosts(data);
      setBookmarkedIds(new Set(data.map(p => p._id)));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: authMode, username, password })
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      localStorage.setItem('user', data.username);
      setUser(data.username);
      setUsername('');
      setPassword('');
      fetchPosts();
      fetchBookmarkIds(data.username);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setPosts([]);
    setBookmarkedIds(new Set());
    setViewMode('feed');
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost, author: user })
    });
    setNewPost('');
    fetchPosts();
  };

  const handleLike = async (postId) => {
    await fetch('/api/posts/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId })
    });
    if (viewMode === 'feed') {
      fetchPosts();
    } else {
      fetchBookmarkedPosts();
    }
  };

  const handleBookmark = async (postId) => {
    const res = await fetch('/api/posts/readit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, username: user })
    });
    const data = await res.json();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (data.bookmarked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
    if (viewMode === 'readit') {
      fetchBookmarkedPosts();
    }
  };

  const switchView = (mode) => {
    setViewMode(mode);
    if (mode === 'feed') {
      fetchPosts();
    } else {
      fetchBookmarkedPosts();
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (!user) {
    return (
      <div className="container">
        <div className="header">
          <h1>Social App</h1>
        </div>
        <div className="auth-form">
          <div className="tabs">
            <button
              className={`btn ${authMode === 'login' ? '' : 'btn-secondary'}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={`btn ${authMode === 'register' ? '' : 'btn-secondary'}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Social App</h1>
        <div>
          <span className="user-info">Hi, {user}!</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={`btn ${viewMode === 'feed' ? '' : 'btn-secondary'}`}
          onClick={() => switchView('feed')}
        >
          Feed
        </button>
        <button
          className={`btn ${viewMode === 'readit' ? '' : 'btn-secondary'}`}
          onClick={() => switchView('readit')}
        >
          Read It ({bookmarkedIds.size})
        </button>
      </div>

      {viewMode === 'feed' && (
        <div className="post-form">
          <form onSubmit={handlePost}>
            <textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <button type="submit" className="btn">Post</button>
          </form>
        </div>
      )}

      <div className="posts">
        {posts.map((post) => (
          <div key={post._id} className="post">
            <div className="post-header">
              <span className="post-author">{post.author}</span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
            <div className="post-content">{post.content}</div>
            <div className="post-actions">
              <button className="like-btn" onClick={() => handleLike(post._id)}>
                &#x2764; {post.likes} likes
              </button>
              <button
                className={`readit-btn ${bookmarkedIds.has(post._id) ? 'readit-active' : ''}`}
                onClick={() => handleBookmark(post._id)}
              >
                &#x1F516; {bookmarkedIds.has(post._id) ? 'Saved' : 'Read It'}
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p style={{textAlign: 'center', color: '#65676b'}}>
            {viewMode === 'feed' ? 'No posts yet. Be the first to post!' : 'No saved posts yet. Bookmark posts to read later!'}
          </p>
        )}
      </div>
    </div>
  );
}
