import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <img
          src={product.image || 'https://via.placeholder.com/60?text=No+Image'}
          alt={product.name}
          className="productImage"
        />
        <div className="productInfo">
          <div className="productName">{product.name}</div>
          <div className="productCategory">{product.category}</div>
          <div className="productDescription">{product.description}</div>
          <div className="productPrice">{product.price.toLocaleString()} ₽</div>
          <div className="productStock">На складе: {product.stock} шт.</div>
          {product.rating && (
            <div className="productRating">Рейтинг: {product.rating} ★</div>
          )}
        </div>
      </div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}