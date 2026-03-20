const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

const ACCESS_SECRET = '8j5w98mc85mehmhc8e';
const REFRESH_SECRET = 'jvuhmc5c4xm3k4j';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

let users = [
  {
    id: nanoid(6),
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    passwordHash: '$2b$10$G.kDDZsNPvr0obh3xa4SBuFCq.Eb/Jvy91UYVCXK6eJM9/LmtX5OC', // admin123
    role: 'admin',
    is_active: true
  },
  {
    id: nanoid(6),
    email: 'seller@example.com',
    first_name: 'Seller',
    last_name: 'Demo',
    passwordHash: '$2b$10$PzjcvOSOv700UUr7pCnDR.BWUuWWeeD.NOtKlTvrWeIBSD0ZIjfD6', // seller123
    role: 'seller',
    is_active: true
  },
  {
    id: nanoid(6),
    email: 'user@example.com',
    first_name: 'Simple',
    last_name: 'User',
    passwordHash: '$2b$10$STYDsK8AX0p8wzjLmB0Hquz7d/lmKMrKq0F/jDOurhdFwrrwWoOBO', // user123
    role: 'user',
    is_active: true
  }
];

let products = [
  { id: nanoid(6), title: 'Ноутбук ASUS ROG', category: 'Ноутбуки', description: 'Игровой ноутбук с RTX 3060', price: 120000, stock: 5, rating: 4.5, image: 'https://via.placeholder.com/150?text=ASUS' },
  { id: nanoid(6), title: 'Смартфон Samsung S23', category: 'Смартфоны', description: 'Флагманский смартфон, 256 ГБ', price: 85000, stock: 8, rating: 4.8, image: 'https://via.placeholder.com/150?text=Samsung' },
  { id: nanoid(6), title: 'Наушники Sony WH-1000XM5', category: 'Аксессуары', description: 'Беспроводные наушники с шумоподавлением', price: 30000, stock: 12, rating: 4.9, image: 'https://via.placeholder.com/150?text=Sony' },
  { id: nanoid(6), title: 'Монитор LG 27" 4K', category: 'Мониторы', description: '27-дюймовый 4K HDR монитор', price: 45000, stock: 3, rating: 4.6, image: 'https://via.placeholder.com/150?text=LG' },
  { id: nanoid(6), title: 'Клавиатура Logitech MX Keys', category: 'Аксессуары', description: 'Беспроводная клавиатура для офиса', price: 12000, stock: 7, rating: 4.7, image: 'https://via.placeholder.com/150?text=Logitech' },
  { id: nanoid(6), title: 'Мышь Razer DeathAdder V2', category: 'Аксессуары', description: 'Игровая мышь с оптическим сенсором', price: 7000, stock: 10, rating: 4.8, image: 'https://via.placeholder.com/150?text=Razer' },
  { id: nanoid(6), title: 'Планшет iPad Air', category: 'Планшеты', description: 'Apple iPad Air 2022, 64 ГБ', price: 65000, stock: 4, rating: 4.9, image: 'https://via.placeholder.com/150?text=iPad' },
  { id: nanoid(6), title: 'Смартфон Xiaomi Redmi Note 12', category: 'Смартфоны', description: 'Бюджетный смартфон, 128 ГБ', price: 25000, stock: 15, rating: 4.3, image: 'https://via.placeholder.com/150?text=Xiaomi' },
  { id: nanoid(6), title: 'Ноутбук MacBook Air M2', category: 'Ноутбуки', description: '13.6" Retina, 8/256 ГБ', price: 130000, stock: 2, rating: 4.9, image: 'https://via.placeholder.com/150?text=MacBook' },
  { id: nanoid(6), title: 'Внешний диск Samsung T7 1TB', category: 'Хранение', description: 'SSD внешний, USB 3.2', price: 12000, stock: 6, rating: 4.7, image: 'https://via.placeholder.com/150?text=Samsung+T7' },
  { id: nanoid(6), title: 'Роутер TP-Link Archer AX73', category: 'Сетевое', description: 'Wi-Fi 6 роутер', price: 9000, stock: 9, rating: 4.5, image: 'https://via.placeholder.com/150?text=TP-Link' },
  { id: nanoid(6), title: 'Умная колонка Яндекс Станция 2', category: 'Умный дом', description: 'С Алисой, звук высокой четкости', price: 15000, stock: 4, rating: 4.6, image: 'https://via.placeholder.com/150?text=Yandex' }
];

let refreshTokens = new Set();

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function findUserOr404(id, res) {
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  return user;
}

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nanoid(6),
    email,
    first_name: first_name || '',
    last_name: last_name || '',
    passwordHash,
    role: 'user',
    is_active: true
  };
  users.push(newUser);
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    role: newUser.role,
    is_active: newUser.is_active
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Account blocked' });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }
  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account blocked' });
    }
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    is_active: user.is_active
  });
});

app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const { title, category, description, price, stock, rating, image } = req.body;
  if (!title || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields: title, price, stock' });
  }
  const newProduct = {
    id: nanoid(6),
    title: title.trim(),
    category: category?.trim() || '',
    description: description?.trim() || '',
    price: Number(price),
    stock: Number(stock),
    rating: rating ? Number(rating) : null,
    image: image?.trim() || 'https://via.placeholder.com/150?text=No+Image'
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  const { title, category, description, price, stock, rating, image } = req.body;
  if (title !== undefined) product.title = title.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = rating ? Number(rating) : null;
  if (image !== undefined) product.image = image.trim() || 'https://via.placeholder.com/150?text=No+Image';
  res.json(product);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const usersWithoutPassword = users.map(({ passwordHash, ...rest }) => rest);
  res.json(usersWithoutPassword);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const id = req.params.id;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...userData } = user;
  res.json(userData);
});

app.patch('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const id = req.params.id;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { first_name, last_name, role, is_active } = req.body;
  if (first_name !== undefined) user.first_name = first_name.trim();
  if (last_name !== undefined) user.last_name = last_name.trim();
  if (role !== undefined && ['user', 'seller', 'admin'].includes(role)) user.role = role;
  if (is_active !== undefined) user.is_active = Boolean(is_active);
  const { passwordHash, ...userData } = user;
  res.json(userData);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});