import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setTitle(initialProduct.title || '');
      setCategory(initialProduct.category || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price != null ? String(initialProduct.price) : '');
      setStock(initialProduct.stock != null ? String(initialProduct.stock) : '');
      setRating(initialProduct.rating != null ? String(initialProduct.rating) : '');
      setImage(initialProduct.image || '');
    } else {
      setTitle('');
      setCategory('');
      setDescription('');
      setPrice('');
      setStock('');
      setRating('');
      setImage('');
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const titleText = mode === 'edit' ? 'Редактирование товара' : 'Добавление товара';

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const numPrice = Number(price);
    const numStock = Number(stock);

    if (!trimmedTitle) {
      alert('Введите название товара');
      return;
    }
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      alert('Введите корректную цену (положительное число)');
      return;
    }
    if (!stock || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      alert('Введите корректное количество на складе (целое неотрицательное число)');
      return;
    }

    const payload = {
      id: initialProduct?.id,
      title: trimmedTitle,
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
      stock: numStock,
      rating: rating ? Number(rating) : null,
      image: image.trim() || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <div className="modal__title">{titleText}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название *
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Смартфон"
              autoFocus
            />
          </label>
          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Электроника, Аксессуары..."
            />
          </label>
          <label className="label">
            Описание
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара"
              rows="2"
            />
          </label>
          <div className="row">
            <label className="label">
              Цена (₽) *
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1000"
              />
            </label>
            <label className="label">
              Количество на складе *
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
              />
            </label>
          </div>
          <div className="row">
            <label className="label">
              Рейтинг (1–5)
              <input
                className="input"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.5"
              />
            </label>
            <label className="label">
              Ссылка на фото
              <input
                className="input"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}