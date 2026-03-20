import React, { useState, useEffect } from 'react';
import './ProductsPage.scss';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const canCreate = user && (user.role === 'seller' || user.role === 'admin');
  const canEdit = user && (user.role === 'seller' || user.role === 'admin');
  const canDelete = user && user.role === 'admin';

  const openCreate = () => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить товар?')) {
      try {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(payload);
        setProducts(prev => [...prev, newProduct]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts(prev => prev.map(p => p.id === payload.id ? updated : p));
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Electronics Shop</div>
          <div className="header__right">
            {user ? (
              <>
                <span>{user.email} ({user.role})</span>
                <button onClick={logout} style={{ marginLeft: 10 }}>Выйти</button>
              </>
            ) : (
              <span>Гость</span>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товары</h1>
            {canCreate && (
              <button className="btn btn--primary" onClick={openCreate}>
                + Добавить товар
              </button>
            )}
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <ProductList
              products={products}
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} Electronics Shop</div>
      </footer>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}