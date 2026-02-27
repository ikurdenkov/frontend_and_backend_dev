const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3001' }));

// Middleware для парсинга JSON
app.use(express.json());

// Начальные данные
let products = [
  { id: 1, name: 'Ноутбук', price: 75000 },
  { id: 2, name: 'Мышь', price: 1500 },
  { id: 3, name: 'Клавиатура', price: 3000 }
];

// Получить все товары
app.get('/products', (req, res) => {
  res.json(products);
});

// Получить товар по id
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  res.json(product);
});

// Добавить новый товар
app.post('/products', (req, res) => {
  const { name, price } = req.body;

  // Валидация
  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Необходимо указать name и price' });
  }

  // Генерируем новый id
  const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  const newProduct = { id: newId, name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Обновить товар
app.patch('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }

  const { name, price } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;

  res.json(product);
});

// Удалить товар
app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Товар не найден' });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});