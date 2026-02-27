const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

let products = [
  { id: nanoid(6), name: 'Ноутбук ASUS ROG', category: 'Ноутбуки', description: 'Игровой ноутбук с RTX 3060', price: 120000, stock: 5, rating: 4.5, image: 'https://via.placeholder.com/150?text=ASUS' },
  { id: nanoid(6), name: 'Смартфон Samsung S23', category: 'Смартфоны', description: 'Флагманский смартфон, 256 ГБ', price: 85000, stock: 8, rating: 4.8, image: 'https://via.placeholder.com/150?text=Samsung' },
  { id: nanoid(6), name: 'Наушники Sony WH-1000XM5', category: 'Аксессуары', description: 'Беспроводные наушники с шумоподавлением', price: 30000, stock: 12, rating: 4.9, image: 'https://via.placeholder.com/150?text=Sony' },
  { id: nanoid(6), name: 'Монитор LG 27" 4K', category: 'Мониторы', description: '27-дюймовый 4K HDR монитор', price: 45000, stock: 3, rating: 4.6, image: 'https://via.placeholder.com/150?text=LG' },
  { id: nanoid(6), name: 'Клавиатура Logitech MX Keys', category: 'Аксессуары', description: 'Беспроводная клавиатура для офиса', price: 12000, stock: 7, rating: 4.7, image: 'https://via.placeholder.com/150?text=Logitech' },
  { id: nanoid(6), name: 'Мышь Razer DeathAdder V2', category: 'Аксессуары', description: 'Игровая мышь с оптическим сенсором', price: 7000, stock: 10, rating: 4.8, image: 'https://via.placeholder.com/150?text=Razer' },
  { id: nanoid(6), name: 'Планшет iPad Air', category: 'Планшеты', description: 'Apple iPad Air 2022, 64 ГБ', price: 65000, stock: 4, rating: 4.9, image: 'https://via.placeholder.com/150?text=iPad' },
  { id: nanoid(6), name: 'Смартфон Xiaomi Redmi Note 12', category: 'Смартфоны', description: 'Бюджетный смартфон, 128 ГБ', price: 25000, stock: 15, rating: 4.3, image: 'https://via.placeholder.com/150?text=Xiaomi' },
  { id: nanoid(6), name: 'Ноутбук MacBook Air M2', category: 'Ноутбуки', description: '13.6" Retina, 8/256 ГБ', price: 130000, stock: 2, rating: 4.9, image: 'https://via.placeholder.com/150?text=MacBook' },
  { id: nanoid(6), name: 'Внешний диск Samsung T7 1TB', category: 'Хранение', description: 'SSD внешний, USB 3.2', price: 12000, stock: 6, rating: 4.7, image: 'https://via.placeholder.com/150?text=Samsung+T7' },
  { id: nanoid(6), name: 'Роутер TP-Link Archer AX73', category: 'Сетевое', description: 'Wi-Fi 6 роутер', price: 9000, stock: 9, rating: 4.5, image: 'https://via.placeholder.com/150?text=TP-Link' },
  { id: nanoid(6), name: 'Умная колонка Яндекс Станция 2', category: 'Умный дом', description: 'С Алисой, звук высокой четкости', price: 15000, stock: 4, rating: 4.6, image: 'https://via.placeholder.com/150?text=Yandex' }
];

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, price, stock' });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
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

app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { name, category, description, price, stock, rating, image } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = rating ? Number(rating) : null;
  if (image !== undefined) product.image = image.trim() || 'https://via.placeholder.com/150?text=No+Image';

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});