const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;
// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Electronics Shop API',
      version: '1.0.0',
      description: 'API для управления товарами интернет-магазина электроники',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер',
      },
    ],
  },
  // Путь к файлам, содержащим JSDoc-аннотации (текущий файл)
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Подробное описание товара
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *         rating:
 *           type: number
 *           description: Рейтинг товара (от 1 до 5)
 *         image:
 *           type: string
 *           description: URL изображения товара
 *       example:
 *         id: "abc123"
 *         name: "Ноутбук ASUS ROG"
 *         category: "Ноутбуки"
 *         description: "Игровой ноутбук с RTX 3060"
 *         price: 120000
 *         stock: 5
 *         rating: 4.5
 *         image: "https://via.placeholder.com/150?text=ASUS"
 */

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

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Успешный ответ – массив товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по его ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создаёт новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *             example:
 *               name: "Новый товар"
 *               category: "Аксессуары"
 *               description: "Описание нового товара"
 *               price: 9999
 *               stock: 10
 *               rating: 4.2
 *               image: "https://example.com/image.jpg"
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Не заполнены обязательные поля
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновляет данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар удалён (нет содержимого)
 *       404:
 *         description: Товар не найден
 */
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